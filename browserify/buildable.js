// // require...
const core = require('@nlpjs/core');
const nlp = require('@nlpjs/nlp');
const langenmin = require('@nlpjs/lang-en-min');
const langde = require('@nlpjs/lang-de');
const requestrn = require('@nlpjs/request-rn');


window.nlpjs = { ...core, ...nlp, ...langenmin, ...langde, ...requestrn };

