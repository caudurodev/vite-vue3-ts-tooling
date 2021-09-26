from flask import Flask, request
import redis
import time
import spacy
import requests
import json
# from dictcc import Dict
# from wiktionaryparser import WiktionaryParser
# from deep_translator import (GoogleTranslator,
#                              MicrosoftTranslator,
#                              PonsTranslator,
#                              LingueeTranslator,
#                              MyMemoryTranslator,
#                              YandexTranslator,
#                              PapagoTranslator,
#                              DeepL,
#                              QCRI,
#                              single_detection,
#                              batch_detection
#                              )


app = Flask(__name__)
nlp = spacy.load("de_core_news_lg")


@app.route('/translate', methods=['POST'])
def translate():
    word = request.form.get('word')
    sentence = request.form.get('sentence')
    sourceLang = request.form.get('sourceLang')
    targetLang = request.form.get('targetLang')

    if None in (word, sentence, sourceLang, targetLang):
        return 'Incorrect Params', 422

    word_doc = nlp(word)
    word_tokens = []
    for token in word_doc:
        word_tokens.append({
            'text': token.text,
            'pos': token.pos_,
            'lemma': token.lemma_
        })

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
                'token': word_tokens
            },
            'sentence': translated_list[1],
        },
        'translated_string': translated_string,
        'translated_list': translated_list,
    }


if __name__ in "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
