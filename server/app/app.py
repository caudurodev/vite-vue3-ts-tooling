from flask import Flask, request
from collections import Counter
# from nltk import ngrams
from flask_cors import CORS
# import redis
import time
# import spacy
import requests
import json
from bs4 import BeautifulSoup
# from dictcc import Dict
# from wiktionaryparser import WiktionaryParser
# from textblob_de import TextBlobDE
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
CORS(app)
# nlp = spacy.load("de_dep_news_trf")

# translator_dictcc = Dict()


@app.route('/translate', methods=['POST'])
def translate():

    sentence_tokens = request.json['sentenceTokens']
    word_id = request.json['wordId']
    sourceLang = request.json['sourceLang']
    targetLang = request.json['targetLang']

    translation_string = ''
    for token in sentence_tokens:
        if token['id'] == word_id:
            translation_string = f'{translation_string} <mark>{token["text"]}</mark>'
        else:
            translation_string = f'{translation_string} {token["text"]}'

    print('translation_string')
    print(translation_string)

    r = requests.post('http://libretranslate:5000/translate', data={
        'q': f'{translation_string}',
        'source': sourceLang,
        'target': targetLang,
        'format': 'html'
    })
    translated_string = r.json()['translatedText']

    print('translated_string')
    print(translated_string)

    soup = BeautifulSoup(translated_string)
    translation_partial = soup.find('mark').getText()

    print('translation_partial')
    print(translation_partial)

    return {
        'translations': {
            'word': {
                'translation': translation_partial
            }
        }
    }
    # word = request.json['word'].strip().replace('  ', ' ')
    # sentence_tokens = request.json['sentenceTokens']
    # word_id = request.json['wordId']
    # sentence = request.json['sentence'].strip().replace('  ', ' ')
    # sourceLang = request.json['sourceLang'].strip().replace('  ', ' ')
    # targetLang = request.json['targetLang'].strip().replace('  ', ' ')
    # if None in (word, sentence, sourceLang, targetLang):
    #     return 'Incorrect Params', 422

    # word_token = None
    # for token in sentence_tokens:
    #     if token['id'] == word_id:
    #         word_token = token
    # # print('chosen word_token')
    # # print(word_token)

    # # print('sentence_tokens received')
    # # print(word_id)
    # # print(len(sentence_tokens))
    # # print(sentence_tokens)

    # word_doc = nlp(word)
    # word_tokens = []
    # for token in word_doc:
    #     word_tokens.append({
    #         'text': token.text,
    #         'pos': token.pos_,
    #         'lemma': token.lemma_
    #     })

    # sentence_doc = nlp(sentence)
    # sentence_tokens_spacy = []
    # counter = -1
    # for token in sentence_doc:
    #     if token.pos_ != 'SPACE':
    #         counter = counter + 1
    #     sentence_tokens_spacy.append({
    #         'text': token.text,
    #         'pos': token.pos_,
    #         'lemma': token.lemma_,
    #         'id': counter if token.pos_ != 'SPACE' else -1
    #     })
    # # print('sentence_tokens_spacy spacy')
    # word_token_spacy = None
    # for token in sentence_tokens_spacy:
    #     if token['id'] == word_id:
    #         word_token_spacy = token
    # # print('chosen word_token_spacy')
    # # print(word_token_spacy)
    # print(f'String: {word}')
    # print(f"same word = {word_token_spacy['text'] == word_token['text']}")
    # # print(len(sentence_tokens))
    # # print(sentence_tokens)

    # doc = nlp(sentence)
    # tokens = []
    # text_tokens = []

    # for token in doc:
    #     text_tokens.append(token.text)
    #     # tokens.append(token)
    #     tokens.append({
    #         'text': token.text,
    #         'pos': token.pos_,
    #         'lemma': token.lemma_
    #     })
    # # print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
    # #       token.shape_, token.is_alpha, token.is_stop)

    # # triples = [' '.join(text_tokens[i:i + 3])
    # #            for i in range(len(text_tokens) - 2)]

    # triples = ngrams(text_tokens, 3)
    # print(f'triples: {triples}')
    # # print(f'text tokens: {text_tokens}')

    # triples_with_term = []
    # for triple in triples:
    #     joined = ' '.join(triple)
    #     if word in joined:
    #         triples_with_term.append(joined)

    # print(f'triples_with_term: {triples_with_term}')

    # separator = '252511812333216698'
    # translation_string = f"{word} {separator} {sentence} {separator} {f' {separator} '.join(triples_with_term)}"
    # translated_string = ''

    # print(f'translation_string:{translation_string}')

    # if triples_with_term:
    #     r = requests.post('http://libretranslate:5000/translate', data={
    #         'q': translation_string,
    #         'source': sourceLang,
    #         'target': targetLang,
    #     })
    #     translated_string = r.json()['translatedText']

    # print(f'translated_string:{translated_string}')

    # translated_list = []
    # for translation in translated_string.split(separator):
    #     translated_list.append(translation.strip())

    # print(f'translated_list:{translated_list}')

    # translated_triples = translated_list[2:]

    # print(f'translated_triples:{translated_triples}')

    # translated_tokens = []
    # for translated_triple in translated_triples:
    #     words_split = translated_triple.split()
    #     for w in words_split:
    #         translated_tokens.append(w.strip())

    # print('occurrences')
    # occurrences = []
    # single_word_translation = translated_list[0]
    # occurrences.append(single_word_translation.strip())
    # print(f'main translation: {single_word_translation}')
    # print(f'{translated_tokens}')

    # n1 = Counter(list(ngrams(translated_tokens, 1)))
    # # print('n1')
    # # print(n1)

    # # if single_word_translation in n1.most_common(1)[0][0]:
    # # print()
    # try:
    #     print(f'most common n1: {n1.most_common(1)[0][0][0]}')
    #     # if tie, then dont add...
    #     occurrences.append(n1.most_common(1)[0][0][0])
    # except KeyError:
    #     pass

    # # n2 = Counter(list(ngrams(translated_tokens, 2)))
    # # # print('n2')
    # # # print(n2)

    # # print(f'most common n2: {n2.most_common(1)[0][0]}')
    # # for w in n2.most_common(1)[0][0]:
    # #     # if tie, then dont add...
    # #     occurrences.append(w)

    # # n3 = Counter(list(ngrams(translated_tokens, 3)))
    # # # print('n3')
    # # # print(n3)
    # # print(f'most common n3: {n3.most_common(1)[0][0]}')
    # # for w3 in n3.most_common(1)[0][0]:
    # #     # if tie, then dont add...
    # #     occurrences.append(w3)
    # print('occurrences count:')

    # print(Counter(list(occurrences)))
    # print(f'likely translation:{Counter(list(occurrences)).most_common(1)[0]}')

    # # TODO match word type from spacy with translations from dict (filter adv->adv)
    # # result_dictcc = translator_dictcc.translate(
    # #     word, from_language=sourceLang, to_language=targetLang)
    # # print('result_dictcc.translation_tuples')
    # # print(result_dictcc.translation_tuples)

    # # parser = WiktionaryParser()
    # # wiki_result = parser.fetch(word, 'german')

    # # another_word = parser.fetch('test', 'french')
    # # parser.set_default_language('french')
    # # parser.exclude_part_of_speech('noun')
    # # parser.include_relation('alternative forms')

    # # result_deepl = DeepL(source=sourceLang, target=targetLang).translate(word)

    # # blob = TextBlobDE(word)

    # return {
    #     'requested': {
    #         'word': word,
    #         'sentence': sentence,
    #         'targetLang': targetLang,
    #         'sourceLang': sourceLang,
    #     },
    #     'translations': {
    #         'word': {
    #             'translation': translated_list[0],
    #             'token': word_tokens,
    #             # 'translation_dictcc': result_dictcc.translation_tuples,
    #             # 'translation_deepl': result_deepl
    #             # 'wiki_result': wiki_result
    #             # 'blog_tags': f"{blob.tags}",
    #             # 'blog_noun_phrases': f"{blob.noun_phrases}",
    #             # 'blog_translate': blob.translate(to="en")

    #         },
    #         'sentence': {
    #             'translation': translated_list[1],
    #             'tokens': sentence_tokens,
    #             'sentence_tokens_spacy': sentence_tokens_spacy
    #         },
    #     },
    #     'translated_string': translated_string,
    #     'translated_list': translated_list,
    # }


def count_occurences(d):
    """Applies magic(tm) to the list of strings given as 'd'.
    Returns a list of ratings which might be the coolest substring."""
    myCountings = Counter()

    def allParts(word):
        """Generator that yields all possible word-parts."""
        for i in range(1, len(word)):
            yield word[:i]

    for part in d:
        # count them all
        myCountings.update(allParts(part))

    # get all as tuples and sort based on heuristic length*occurences
    return sorted(myCountings.most_common(),
                  key=lambda x: len(x[0])*(x[1] if x[1] > 1 else 0.1), reverse=True)


if __name__ in "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
