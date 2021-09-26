FROM python:3.9-slim

WORKDIR /app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

RUN apt-get update --allow-insecure-repositories -y && apt-get install apt-file -y && apt-file update && apt-get install -y python3-dev build-essential

RUN pip3 install --upgrade pip
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install -U pip setuptools wheel
RUN pip3 install -U spacy
RUN python -m spacy download en_core_web_lg
RUN python -m spacy download de_core_news_lg
RUN pip3 install -U textblob-de
RUN python -m textblob.download_corpora

EXPOSE 5000
COPY . .

CMD ["python","-u","app.py"]


