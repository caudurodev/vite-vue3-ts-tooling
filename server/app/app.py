import time
import spacy
import requests
import json
from dictcc import Dict
from wiktionaryparser import WiktionaryParser

import redis
from flask import Flask

app = Flask(__name__)
# cache = redis.Redis(host='redis', port=6379)


# def get_hit_count():
#     retries = 5
#     while True:
#         try:
#             return cache.incr('hits')
#         except redis.exceptions.ConnectionError as exc:
#             if retries == 0:
#                 raise exc
#             retries -= 1
#             time.sleep(0.5)


@app.route('/')
def hello():
    # count = get_hit_count()
    nlp = spacy.load("de_core_news_sm")
    sentence = 'Gleichzeitig lockt Kiew Partytouristen aus ganz Europa an.'
    word = 'herrscht'
    # doc = nlp(sentence)
    # tokens = []
    # text_tokens = []

    # for token in doc:
    #     print(token.text)
    #     text_tokens.append(token)
    #     tokens.append({
    #         'text': token.text,
    #         'pos': token.pos_,
    #         'lemma': token.lemma_
    #     })
    # print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
    #       token.shape_, token.is_alpha, token.is_stop)

    # triples = [text_tokens[i:i + 3]
    #            for i in range(len(text_tokens) - 2)]

    # print('tokens')
    # print(tokens)
    # print('triples')
    # print(triples)

    translator = Dict()
    result = translator.translate(
        word, from_language="de", to_language="en")

    r = requests.post('http://libretranslate:5000/translate', data={
        'q': word,
        'source': 'de',
        'target': 'en',
    })
    translated_word = r.json()['translatedText']
    # print(r.json())
    print('doc')

    # return f'{r.json()}Helssslo World! I have been seen {count} times.\n'
    # print(r.json()['translatedText'])
    # return r.json()
    # parser = WiktionaryParser()
    # parser.set_default_language('english')
    # word_parsed = parser.fetch(word, 'german')

    # print('word_parsed')
    # print(word_parsed)

    in_tuples = False
    to_search = translated_word
    for translation_tuple in result.translation_tuples[:4]:
        if(to_search.lower() in translation_tuple[1].lower()):
            in_tuples = True

    return {
        'original': word,
        'translatedText': translated_word,
        'found': in_tuples,
        # 'tokens': tokens,
        # 'text_tokens': text_tokens,
        # 'triples': triples,
        'dict': result.translation_tuples[:4]
    }


if __name__ in "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
