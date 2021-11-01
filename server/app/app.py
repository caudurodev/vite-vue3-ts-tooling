from flask import Flask, request
from flask_cors import CORS
import redis
import time
import spacy
import requests
import json
from dictcc import Dict
from wiktionaryparser import WiktionaryParser
from deep_translator import (GoogleTranslator,
                             MicrosoftTranslator,
                             PonsTranslator,
                             LingueeTranslator,
                             MyMemoryTranslator,
                             YandexTranslator,
                             PapagoTranslator,
                             DeepL,
                             QCRI,
                             single_detection,
                             batch_detection
                             )


app = Flask(__name__)
CORS(app)
nlp = spacy.load("de_core_news_lg")

translator_dictcc = Dict()


@app.route('/translate', methods=['POST'])
def translate():
    word = request.json['word'].strip().replace('  ', ' ')
    sentence_tokens = request.json['sentenceTokens']
    word_id = request.json['wordId']
    sentence = request.json['sentence'].strip().replace('  ', ' ')
    sourceLang = request.json['sourceLang'].strip().replace('  ', ' ')
    targetLang = request.json['targetLang'].strip().replace('  ', ' ')
    if None in (word, sentence, sourceLang, targetLang):
        return 'Incorrect Params', 422

    word_token = None
    for token in sentence_tokens:
        if token['id'] == word_id:
            word_token = token
    print('chosen word_token')
    print(word_token)

    # print('sentence_tokens received')
    # print(word_id)
    # print(len(sentence_tokens))
    # print(sentence_tokens)

    word_doc = nlp(word)
    word_tokens = []
    for token in word_doc:
        word_tokens.append({
            'text': token.text,
            'pos': token.pos_,
            'lemma': token.lemma_
        })

    sentence_doc = nlp(sentence)
    sentence_tokens_spacy = []
    counter = -1
    for token in sentence_doc:

        counter = counter + 1
        sentence_tokens_spacy.append({
            'text': token.text,
            'pos': token.pos_,
            'lemma': token.lemma_,
            'id': counter if token.pos_ != 'SPACE' else -1
        })
    print('sentence_tokens_spacy spacy')
    word_token_spacy = None
    for token in sentence_tokens_spacy:
        if token['id'] == word_id:
            word_token_spacy = token
    print('chosen word_token_spacy')
    print(word_token_spacy)
    # print(len(sentence_tokens))
    # print(sentence_tokens)

    doc = nlp(sentence)
    tokens = []
    text_tokens = []

    for token in doc:
        text_tokens.append(token.text)
        # tokens.append(token)
        tokens.append({
            'text': token.text,
            'pos': token.pos_,
            'lemma': token.lemma_
        })
    # print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
    #       token.shape_, token.is_alpha, token.is_stop)

    triples = [' '.join(text_tokens[i:i + 3])
               for i in range(len(text_tokens) - 2)]

    triples_with_term = []
    for triple in triples:
        if word in triple:
            triples_with_term.append(triple)

    separator = 'a123a'
    translation_string = f"{word} {separator} {separator} {sentence} {f' {separator} '.join(triples_with_term)}"
    translated_string = ''
    if triples_with_term:
        r = requests.post('http://libretranslate:5000/translate', data={
            'q': translation_string,
            'source': sourceLang,
            'target': targetLang,
        })
        translated_string = r.json()['translatedText']

    translated_list = []
    for translation in translated_string.split(f'{separator}'):
        clean = translation.strip()
        if clean:
            translated_list.append(clean)

    # TODO match word type from spacy with translations from dict (filter adv->adv)
    # result_dictcc = translator_dictcc.translate(
    #     word, from_language=sourceLang, to_language=targetLang)
    # print('result_dictcc.translation_tuples')
    # print(result_dictcc.translation_tuples)

    # result_deepl = DeepL(source=sourceLang, target=targetLang).translate(word)

    return {
        'requested': {
            'word': word,
            'sentence': sentence,
            'targetLang': targetLang,
            'sourceLang': sourceLang,
        },
        'translations': {
            'word': {
                'translation': translated_list[0],
                'token': word_tokens,
                # 'translation_dictcc': result_dictcc.translation_tuples,
                # 'translation_deepl': result_deepl

            },
            'sentence': {
                'translation': translated_list[1],
                'tokens': sentence_tokens,
                'sentence_tokens_spacy': sentence_tokens_spacy
            },
        },
        'translated_string': translated_string,
        'translated_list': translated_list,
    }


if __name__ in "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
