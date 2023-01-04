/* **********************************************
     Begin prism-core.js
********************************************** */

define(() => {

    var _self = (typeof window !== 'undefined')
        ? window   // if in browser
        : (
            (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
            ? self // if in worker
            : {}   // if in node js
        );

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     * MIT license http://www.opensource.org/licenses/mit-license.php/
     * @author Lea Verou http://lea.verou.me
     */

    var Prism = (function (_self){

        // Private helper vars
        var lang = /\blang(?:uage)?-([\w-]+)\b/i;
        var uniqueId = 0;

        var _ = {
            manual: _self.Prism && _self.Prism.manual,
            disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
            util: {
                encode: function (tokens) {
                    if (tokens instanceof Token) {
                        return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
                    } else if (Array.isArray(tokens)) {
                        return tokens.map(_.util.encode);
                    } else {
                        return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
                    }
                },

                type: function (o) {
                    return Object.prototype.toString.call(o).slice(8, -1);
                },

                objId: function (obj) {
                    if (!obj['__id']) {
                        Object.defineProperty(obj, '__id', { value: ++uniqueId });
                    }
                    return obj['__id'];
                },

                // Deep clone a language definition (e.g. to extend it)
                clone: function deepClone(o, visited) {
                    var clone, id, type = _.util.type(o);
                    visited = visited || {};

                    switch (type) {
                        case 'Object':
                            id = _.util.objId(o);
                            if (visited[id]) {
                                return visited[id];
                            }
                            clone = {};
                            visited[id] = clone;

                            for (var key in o) {
                                if (o.hasOwnProperty(key)) {
                                    clone[key] = deepClone(o[key], visited);
                                }
                            }

                            return clone;

                        case 'Array':
                            id = _.util.objId(o);
                            if (visited[id]) {
                                return visited[id];
                            }
                            clone = [];
                            visited[id] = clone;

                            o.forEach(function (v, i) {
                                clone[i] = deepClone(v, visited);
                            });

                            return clone;

                        default:
                            return o;
                    }
                }
            },

            languages: {
                extend: function (id, redef) {
                    var lang = _.util.clone(_.languages[id]);

                    for (var key in redef) {
                        lang[key] = redef[key];
                    }

                    return lang;
                },

                /**
                 * Insert a token before another token in a language literal
                 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
                 * we cannot just provide an object, we need an object and a key.
                 * @param inside The key (or language id) of the parent
                 * @param before The key to insert before.
                 * @param insert Object with the key/value pairs to insert
                 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
                 */
                insertBefore: function (inside, before, insert, root) {
                    root = root || _.languages;
                    var grammar = root[inside];
                    var ret = {};

                    for (var token in grammar) {
                        if (grammar.hasOwnProperty(token)) {

                            if (token == before) {
                                for (var newToken in insert) {
                                    if (insert.hasOwnProperty(newToken)) {
                                        ret[newToken] = insert[newToken];
                                    }
                                }
                            }

                            // Do not insert token which also occur in insert. See #1525
                            if (!insert.hasOwnProperty(token)) {
                                ret[token] = grammar[token];
                            }
                        }
                    }

                    var old = root[inside];
                    root[inside] = ret;

                    // Update references in other language definitions
                    _.languages.DFS(_.languages, function(key, value) {
                        if (value === old && key != inside) {
                            this[key] = ret;
                        }
                    });

                    return ret;
                },

                // Traverse a language definition with Depth First Search
                DFS: function DFS(o, callback, type, visited) {
                    visited = visited || {};

                    var objId = _.util.objId;

                    for (var i in o) {
                        if (o.hasOwnProperty(i)) {
                            callback.call(o, i, o[i], type || i);

                            var property = o[i],
                                propertyType = _.util.type(property);

                            if (propertyType === 'Object' && !visited[objId(property)]) {
                                visited[objId(property)] = true;
                                DFS(property, callback, null, visited);
                            }
                            else if (propertyType === 'Array' && !visited[objId(property)]) {
                                visited[objId(property)] = true;
                                DFS(property, callback, i, visited);
                            }
                        }
                    }
                }
            },
            plugins: {},

            highlightAll: function(async, callback) {
                _.highlightAllUnder(document, async, callback);
            },

            highlightAllUnder: function(container, async, callback) {
                var env = {
                    callback: callback,
                    selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
                };

                _.hooks.run("before-highlightall", env);

                var elements = env.elements || container.querySelectorAll(env.selector);

                for (var i=0, element; element = elements[i++];) {
                    _.highlightElement(element, async === true, env.callback);
                }
            },

            highlightElement: function(element, async, callback) {
                // Find language
                var language, grammar, parent = element;

                while (parent && !lang.test(parent.className)) {
                    parent = parent.parentNode;
                }

                if (parent) {
                    language = (parent.className.match(lang) || [,''])[1].toLowerCase();
                    grammar = _.languages[language];
                }

                // Set language on the element, if not present
                element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

                if (element.parentNode) {
                    // Set language on the parent, for styling
                    parent = element.parentNode;

                    if (/pre/i.test(parent.nodeName)) {
                        parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
                    }
                }

                var code = element.textContent;

                var env = {
                    element: element,
                    language: language,
                    grammar: grammar,
                    code: code
                };

                var insertHighlightedCode = function (highlightedCode) {
                    env.highlightedCode = highlightedCode;

                    _.hooks.run('before-insert', env);

                    env.element.innerHTML = env.highlightedCode;

                    _.hooks.run('after-highlight', env);
                    _.hooks.run('complete', env);
                    callback && callback.call(env.element);
                }

                _.hooks.run('before-sanity-check', env);

                if (!env.code) {
                    _.hooks.run('complete', env);
                    return;
                }

                _.hooks.run('before-highlight', env);

                if (!env.grammar) {
                    insertHighlightedCode(_.util.encode(env.code));
                    return;
                }

                if (async && _self.Worker) {
                    var worker = new Worker(_.filename);

                    worker.onmessage = function(evt) {
                        insertHighlightedCode(evt.data);
                    };

                    worker.postMessage(JSON.stringify({
                        language: env.language,
                        code: env.code,
                        immediateClose: true
                    }));
                }
                else {
                    insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
                }
            },

            highlight: function (text, grammar, language) {
                var env = {
                    code: text,
                    grammar: grammar,
                    language: language
                };
                _.hooks.run('before-tokenize', env);
                env.tokens = _.tokenize(env.code, env.grammar);
                _.hooks.run('after-tokenize', env);
                return Token.stringify(_.util.encode(env.tokens), env.language);
            },

            matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
                for (var token in grammar) {
                    if(!grammar.hasOwnProperty(token) || !grammar[token]) {
                        continue;
                    }

                    if (token == target) {
                        return;
                    }

                    var patterns = grammar[token];
                    patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

                    for (var j = 0; j < patterns.length; ++j) {
                        var pattern = patterns[j],
                            inside = pattern.inside,
                            lookbehind = !!pattern.lookbehind,
                            greedy = !!pattern.greedy,
                            lookbehindLength = 0,
                            alias = pattern.alias;

                        if (greedy && !pattern.pattern.global) {
                            // Without the global flag, lastIndex won't work
                            var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
                            pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
                        }

                        pattern = pattern.pattern || pattern;

                        // Don’t cache length as it changes during the loop
                        for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

                            var str = strarr[i];

                            if (strarr.length > text.length) {
                                // Something went terribly wrong, ABORT, ABORT!
                                return;
                            }

                            if (str instanceof Token) {
                                continue;
                            }

                            if (greedy && i != strarr.length - 1) {
                                pattern.lastIndex = pos;
                                var match = pattern.exec(text);
                                if (!match) {
                                    break;
                                }

                                var from = match.index + (lookbehind ? match[1].length : 0),
                                    to = match.index + match[0].length,
                                    k = i,
                                    p = pos;

                                for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
                                    p += strarr[k].length;
                                    // Move the index i to the element in strarr that is closest to from
                                    if (from >= p) {
                                        ++i;
                                        pos = p;
                                    }
                                }

                                // If strarr[i] is a Token, then the match starts inside another Token, which is invalid
                                if (strarr[i] instanceof Token) {
                                    continue;
                                }

                                // Number of tokens to delete and replace with the new match
                                delNum = k - i;
                                str = text.slice(pos, p);
                                match.index -= pos;
                            } else {
                                pattern.lastIndex = 0;

                                var match = pattern.exec(str),
                                    delNum = 1;
                            }

                            if (!match) {
                                if (oneshot) {
                                    break;
                                }

                                continue;
                            }

                            if(lookbehind) {
                                lookbehindLength = match[1] ? match[1].length : 0;
                            }

                            var from = match.index + lookbehindLength,
                                match = match[0].slice(lookbehindLength),
                                to = from + match.length,
                                before = str.slice(0, from),
                                after = str.slice(to);

                            var args = [i, delNum];

                            if (before) {
                                ++i;
                                pos += before.length;
                                args.push(before);
                            }

                            var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

                            args.push(wrapped);

                            if (after) {
                                args.push(after);
                            }

                            Array.prototype.splice.apply(strarr, args);

                            if (delNum != 1)
                                _.matchGrammar(text, strarr, grammar, i, pos, true, token);

                            if (oneshot)
                                break;
                        }
                    }
                }
            },

            tokenize: function(text, grammar) {
                var strarr = [text];

                var rest = grammar.rest;

                if (rest) {
                    for (var token in rest) {
                        grammar[token] = rest[token];
                    }

                    delete grammar.rest;
                }

                _.matchGrammar(text, strarr, grammar, 0, 0, false);

                return strarr;
            },

            hooks: {
                all: {},

                add: function (name, callback) {
                    var hooks = _.hooks.all;

                    hooks[name] = hooks[name] || [];

                    hooks[name].push(callback);
                },

                run: function (name, env) {
                    var callbacks = _.hooks.all[name];

                    if (!callbacks || !callbacks.length) {
                        return;
                    }

                    for (var i=0, callback; callback = callbacks[i++];) {
                        callback(env);
                    }
                }
            },

            Token: Token
        };

        _self.Prism = _;

        function Token(type, content, alias, matchedStr, greedy) {
            this.type = type;
            this.content = content;
            this.alias = alias;
            // Copy of the full string this token was created from
            this.length = (matchedStr || "").length|0;
            this.greedy = !!greedy;
        }

        Token.stringify = function(o, language, parent) {
            if (typeof o == 'string') {
                return o;
            }

            if (Array.isArray(o)) {
                return o.map(function(element) {
                    return Token.stringify(element, language, o);
                }).join('');
            }

            var env = {
                type: o.type,
                content: Token.stringify(o.content, language, parent),
                tag: 'span',
                classes: ['token', o.type],
                attributes: {},
                language: language,
                parent: parent
            };

            if (o.alias) {
                var aliases = Array.isArray(o.alias) ? o.alias : [o.alias];
                Array.prototype.push.apply(env.classes, aliases);
            }

            _.hooks.run('wrap', env);

            var attributes = Object.keys(env.attributes).map(function(name) {
                return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
            }).join(' ');

            return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

        };

        if (!_self.document) {
            if (!_self.addEventListener) {
                // in Node.js
                return _;
            }

            if (!_.disableWorkerMessageHandler) {
                // In worker
                _self.addEventListener('message', function (evt) {
                    var message = JSON.parse(evt.data),
                        lang = message.language,
                        code = message.code,
                        immediateClose = message.immediateClose;

                    _self.postMessage(_.highlight(code, _.languages[lang], lang));
                    if (immediateClose) {
                        _self.close();
                    }
                }, false);
            }

            return _;
        }

        //Get current script and highlight
        var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

        if (script) {
            _.filename = script.src;

            if (!_.manual && !script.hasAttribute('data-manual')) {
                if(document.readyState !== "loading") {
                    if (window.requestAnimationFrame) {
                        window.requestAnimationFrame(_.highlightAll);
                    } else {
                        window.setTimeout(_.highlightAll, 16);
                    }
                }
                else {
                    document.addEventListener('DOMContentLoaded', _.highlightAll);
                }
            }
        }

        return _;

    })(_self);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof global !== 'undefined') {
        global.Prism = Prism;
    }


    /* **********************************************
        Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
    comment: /<!--[\s\S]*?-->/,
    prolog: /<\?[\s\S]+?\?>/,
    doctype: /<!DOCTYPE[\s\S]+?>/i,
    cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
    tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
        greedy: true,
        inside: {
        tag: {
            pattern: /^<\/?[^\s>\/]+/i,
            inside: {
            punctuation: /^<\/?/,
            namespace: /^[^\s>\/:]+:/,
            },
        },
        'attr-value': {
            pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
            inside: {
            punctuation: [
                /^=/,
                {
                pattern: /(^|[^\\])["']/,
                lookbehind: true,
                },
            ],
            },
        },
        punctuation: /\/?>/,
        'attr-name': {
            pattern: /[^\s>\/]+/,
            inside: {
            namespace: /^[^\s>\/:]+:/,
            },
        },

        },
    },
    entity: /&#?[\da-z]{1,8};/i,
    };

    Prism.languages.markup.tag.inside['attr-value'].inside.entity =	Prism.languages.markup.entity;

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', (env) => {

        if (env.type === 'entity') {
            env.attributes['title'] = env.content.replace(/&amp;/, '&');
        }
    });

    Prism.languages.xml = Prism.languages.markup;
    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;


    /* **********************************************
        Begin prism-css.js
    ********************************************** */

    Prism.languages.css = {
    comment: /\/\*[\s\S]*?\*\//,
    atrule: {
        pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i,
        inside: {
        rule: /@[\w-]+/,
        // See rest below
        },
    },
    url: /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
    selector: /[^{}\s][^{};]*?(?=\s*\{)/,
    string: {
        pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
    },
    property: /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    important: /\B!important\b/i,
    function: /[-a-z0-9]+(?=\()/i,
    punctuation: /[(){};:]/,
    };

    Prism.languages.css.atrule.inside.rest = Prism.languages.css;

    if (Prism.languages.markup) {
    Prism.languages.insertBefore('markup', 'tag', {
        style: {
        pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
        lookbehind: true,
        inside: Prism.languages.css,
        alias: 'language-css',
        greedy: true,
        },
    });

    Prism.languages.insertBefore('inside', 'attr-value', {
        'style-attr': {
        pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
        inside: {
            'attr-name': {
            pattern: /^\s*style/i,
            inside: Prism.languages.markup.tag.inside,
            },
            punctuation: /^\s*=\s*['"]|['"]\s*$/,
            'attr-value': {
            pattern: /.+/i,
            inside: Prism.languages.css,
            },
        },
        alias: 'language-css',
        },
    }, Prism.languages.markup.tag);
    }

    /* **********************************************
        Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
    comment: [
        {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true,
        },
        {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true,
        },
    ],
    string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
    },
    'class-name': {
        pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
        lookbehind: true,
        inside: {
        punctuation: /[.\\]/,
        },
    },
    keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    boolean: /\b(?:true|false)\b/,
    function: /[a-z0-9_]+(?=\()/i,
    number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
    punctuation: /[{}[\];(),.:]/,
    };


    /***********************************************
         Begin prism-javascript.js
    ***********************************************/

    Prism.languages.javascript = Prism.languages.extend('clike', {
    keyword: /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
    number: /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    function: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,
    operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/,
    });

    Prism.languages.insertBefore('javascript', 'keyword', {
    regex: {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
        lookbehind: true,
        greedy: true,
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    'function-variable': {
        pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,
        alias: 'function',
    },
    constant: /\b[A-Z][A-Z\d_]*\b/,
    });

    Prism.languages.insertBefore('javascript', 'string', {
    'template-string': {
        pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
        greedy: true,
        inside: {
        interpolation: {
            pattern: /\${[^}]+}/,
            inside: {
            'interpolation-punctuation': {
                pattern: /^\${|}$/,
                alias: 'punctuation',
            },
            rest: null, // See below
            },
        },
        string: /[\s\S]+/,
        },
    },
    });
    Prism.languages.javascript['template-string'].inside.interpolation.inside.rest = Prism.languages.javascript;

    if (Prism.languages.markup) {
    Prism.languages.insertBefore('markup', 'tag', {
        script: {
        pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
        lookbehind: true,
        inside: Prism.languages.javascript,
        alias: 'language-javascript',
        greedy: true,
        },
    });
    }

    Prism.languages.js = Prism.languages.javascript;

    /***********************************************
         Begin component prism-markup-templating.js
    ***********************************************/
    (function (Prism) {

        /**
         * Returns the placeholder for the given language id and index.
         *
         * @param {string} language
         * @param {string|number} index
         * @returns {string}
         */
        function getPlaceholder(language, index) {
            return '___' + language.toUpperCase() + index + '___';
        }

        Object.defineProperties(Prism.languages['markup-templating'] = {}, {
            buildPlaceholders: {
                /**
                 * Tokenize all inline templating expressions matching `placeholderPattern`.
                 *
                 * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
                 * `true` will be replaced.
                 *
                 * @param {object} env The environment of the `before-tokenize` hook.
                 * @param {string} language The language id.
                 * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
                 * @param {(match: string) => boolean} [replaceFilter]
                 */
                value: function (env, language, placeholderPattern, replaceFilter) {
                    if (env.language !== language) {
                        return;
                    }

                    var tokenStack = env.tokenStack = [];

                    env.code = env.code.replace(placeholderPattern, function (match) {
                        if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
                            return match;
                        }
                        var i = tokenStack.length;
                        var placeholder;

                        // Check for existing strings
                        while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1)
                            ++i;

                        // Create a sparse array
                        tokenStack[i] = match;

                        return placeholder;
                    });

                    // Switch the grammar to markup
                    env.grammar = Prism.languages.markup;
                }
            },
            tokenizePlaceholders: {
                /**
                 * Replace placeholders with proper tokens after tokenizing.
                 *
                 * @param {object} env The environment of the `after-tokenize` hook.
                 * @param {string} language The language id.
                 */
                value: function (env, language) {
                    if (env.language !== language || !env.tokenStack) {
                        return;
                    }

                    // Switch the grammar back
                    env.grammar = Prism.languages[language];

                    var j = 0;
                    var keys = Object.keys(env.tokenStack);

                    function walkTokens(tokens) {
                        for (var i = 0; i < tokens.length; i++) {
                            // all placeholders are replaced already
                            if (j >= keys.length) {
                                break;
                            }

                            var token = tokens[i];
                            if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
                                var k = keys[j];
                                var t = env.tokenStack[k];
                                var s = typeof token === 'string' ? token : token.content;
                                var placeholder = getPlaceholder(language, k);

                                var index = s.indexOf(placeholder);
                                if (index > -1) {
                                    ++j;

                                    var before = s.substring(0, index);
                                    var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                                    var after = s.substring(index + placeholder.length);

                                    var replacement = [];
                                    if (before) {
                                        replacement.push.apply(replacement, walkTokens([before]));
                                    }
                                    replacement.push(middle);
                                    if (after) {
                                        replacement.push.apply(replacement, walkTokens([after]));
                                    }

                                    if (typeof token === 'string') {
                                        tokens.splice.apply(tokens, [i, 1].concat(replacement));
                                    } else {
                                        token.content = replacement;
                                    }
                                }
                            } else if (token.content /* && typeof token.content !== 'string' */) {
                                walkTokens(token.content);
                            }
                        }

                        return tokens;
                    }

                    walkTokens(env.tokens);
                }
            }
        });

    }(Prism));

    /***********************************************
         Begin component prism-php.js
    ***********************************************/
    /**
     * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
     * Modified by Miles Johnson: http://milesj.me
     *
     * Supports the following:
     * 		- Extends clike syntax
     * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
     * 		- Smarter constant and function matching
     *
     * Adds the following new token classes:
     * 		constant, delimiter, variable, function, package
     */
    (function (Prism) {
        Prism.languages.php = Prism.languages.extend('clike', {
            'keyword': /\b(?:__halt_compiler|abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|parent|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
            'boolean': {
                pattern: /\b(?:false|true)\b/i,
                alias: 'constant'
            },
            'constant': [
                /\b[A-Z_][A-Z0-9_]*\b/,
                /\b(?:null)\b/i,
            ],
            'comment': {
                pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
                lookbehind: true
            }
        });

        Prism.languages.insertBefore('php', 'string', {
            'shell-comment': {
                pattern: /(^|[^\\])#.*/,
                lookbehind: true,
                alias: 'comment'
            }
        });

        Prism.languages.insertBefore('php', 'comment', {
            'delimiter': {
                pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
                alias: 'important'
            }
        });

        Prism.languages.insertBefore('php', 'keyword', {
            'variable': /\$+(?:\w+\b|(?={))/i,
            'package': {
                pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
                lookbehind: true,
                inside: {
                    punctuation: /\\/
                }
            }
        });

        // Must be defined after the function pattern
        Prism.languages.insertBefore('php', 'operator', {
            'property': {
                pattern: /(->)[\w]+/,
                lookbehind: true
            }
        });

        var string_interpolation = {
            pattern: /{\$(?:{(?:{[^{}]+}|[^{}]+)}|[^{}])+}|(^|[^\\{])\$+(?:\w+(?:\[.+?]|->\w+)*)/,
            lookbehind: true,
            inside: {
                rest: Prism.languages.php
            }
        };

        Prism.languages.insertBefore('php', 'string', {
            'nowdoc-string': {
                pattern: /<<<'([^']+)'(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;/,
                greedy: true,
                alias: 'string',
                inside: {
                    'delimiter': {
                        pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
                        alias: 'symbol',
                        inside: {
                            'punctuation': /^<<<'?|[';]$/
                        }
                    }
                }
            },
            'heredoc-string': {
                pattern: /<<<(?:"([^"]+)"(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;|([a-z_]\w*)(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\2;)/i,
                greedy: true,
                alias: 'string',
                inside: {
                    'delimiter': {
                        pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
                        alias: 'symbol',
                        inside: {
                            'punctuation': /^<<<"?|[";]$/
                        }
                    },
                    'interpolation': string_interpolation // See below
                }
            },
            'single-quoted-string': {
                pattern: /'(?:\\[\s\S]|[^\\'])*'/,
                greedy: true,
                alias: 'string'
            },
            'double-quoted-string': {
                pattern: /"(?:\\[\s\S]|[^\\"])*"/,
                greedy: true,
                alias: 'string',
                inside: {
                    'interpolation': string_interpolation // See below
                }
            }
        });
        // The different types of PHP strings "replace" the C-like standard string
        delete Prism.languages.php['string'];

        Prism.hooks.add('before-tokenize', function(env) {
            if (!/<\?/.test(env.code)) {
                return;
            }

            var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#)(?:[^?\n\r]|\?(?!>))*|\/\*[\s\S]*?(?:\*\/|$))*?(?:\?>|$)/ig;
            Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
        });

        Prism.hooks.add('after-tokenize', function(env) {
            Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
        });

    }(Prism));

    Prism.languages.insertBefore('php', 'variable', {
        'this': /\$this\b/,
        'global': /\$(?:_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)|GLOBALS|HTTP_RAW_POST_DATA|argc|argv|php_errormsg|http_response_header)\b/,
        'scope': {
            pattern: /\b[\w\\]+::/,
            inside: {
                keyword: /static|self|parent/,
                punctuation: /::|\\/
            }
        }
    });

    /***********************************************
         Begin component prism-ruby.js
    ***********************************************/
    /**
     * Original by Samuel Flores
     *
     * Adds the following new token classes:
     * 		constant, builtin, variable, symbol, regex
     */
    (function(Prism) {
        Prism.languages.ruby = Prism.languages.extend('clike', {
            'comment': [
                /#.*/,
                {
                    pattern: /^=begin\s[\s\S]*?^=end/m,
                    greedy: true
                }
            ],
            'keyword': /\b(?:alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|protected|private|public|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/
        });

        var interpolation = {
            pattern: /#\{[^}]+\}/,
            inside: {
                'delimiter': {
                    pattern: /^#\{|\}$/,
                    alias: 'tag'
                },
                rest: Prism.languages.ruby
            }
        };

        delete Prism.languages.ruby.function;

        Prism.languages.insertBefore('ruby', 'keyword', {
            'regex': [
                {
                    pattern: /%r([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1[gim]{0,3}/,
                    greedy: true,
                    inside: {
                        'interpolation': interpolation
                    }
                },
                {
                    pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
                    greedy: true,
                    inside: {
                        'interpolation': interpolation
                    }
                },
                {
                    // Here we need to specifically allow interpolation
                    pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
                    greedy: true,
                    inside: {
                        'interpolation': interpolation
                    }
                },
                {
                    pattern: /%r\[(?:[^\[\]\\]|\\[\s\S])*\][gim]{0,3}/,
                    greedy: true,
                    inside: {
                        'interpolation': interpolation
                    }
                },
                {
                    pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
                    greedy: true,
                    inside: {
                        'interpolation': interpolation
                    }
                },
                {
                    pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
                    lookbehind: true,
                    greedy: true
                }
            ],
            'variable': /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
            'symbol': {
                pattern: /(^|[^:]):[a-zA-Z_]\w*(?:[?!]|\b)/,
                lookbehind: true
            },
            'method-definition': {
                pattern: /(\bdef\s+)[\w.]+/,
                lookbehind: true,
                inside: {
                    'function': /\w+$/,
                    rest: Prism.languages.ruby
                }
            }
        });

        Prism.languages.insertBefore('ruby', 'number', {
            'builtin': /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|Fixnum|Float|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
            'constant': /\b[A-Z]\w*(?:[?!]|\b)/
        });

        Prism.languages.ruby.string = [
            {
                pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            },
            {
                pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            },
            {
                // Here we need to specifically allow interpolation
                pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            },
            {
                pattern: /%[qQiIwWxs]?\[(?:[^\[\]\\]|\\[\s\S])*\]/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            },
            {
                pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            },
            {
                pattern: /("|')(?:#\{[^}]+\}|\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            }
        ];

        Prism.languages.rb = Prism.languages.ruby;
    }(Prism));

    /***********************************************
         Begin component prism-python.js
    ***********************************************/
    Prism.languages.python = {
        'comment': {
            pattern: /(^|[^\\])#.*/,
            lookbehind: true
        },
        'string-interpolation': {
            pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
            greedy: true,
            inside: {
                'interpolation': {
                    // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
                    pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,
                    lookbehind: true,
                    inside: {
                        'format-spec': {
                            pattern: /(:)[^:(){}]+(?=}$)/,
                            lookbehind: true
                        },
                        'conversion-option': {
                            pattern: /![sra](?=[:}]$)/,
                            alias: 'punctuation'
                        },
                        rest: null
                    }
                },
                'string': /[\s\S]+/
            }
        },
        'triple-quoted-string': {
            pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]+?\1/i,
            greedy: true,
            alias: 'string'
        },
        'string': {
            pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
            greedy: true
        },
        'function': {
            pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
            lookbehind: true
        },
        'class-name': {
            pattern: /(\bclass\s+)\w+/i,
            lookbehind: true
        },
        'decorator': {
            pattern: /(^\s*)@\w+(?:\.\w+)*/i,
            lookbehind: true,
            alias: ['annotation', 'punctuation'],
            inside: {
                'punctuation': /\./
            }
        },
        'keyword': /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
        'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
        'boolean': /\b(?:True|False|None)\b/,
        'number': /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
        'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
        'punctuation': /[{}[\];(),.:]/
    };

    Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

    Prism.languages.py = Prism.languages.python;

    /***********************************************
         Begin component prism-java.js
    ***********************************************/
    (function (Prism) {

        var keywords = /\b(?:abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while|var|null|exports|module|open|opens|provides|requires|to|transitive|uses|with)\b/;

        // based on the java naming conventions
        var className = /\b[A-Z](?:\w*[a-z]\w*)?\b/;

        Prism.languages.java = Prism.languages.extend('clike', {
            'class-name': [
                className,

                // variables and parameters
                // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
                /\b[A-Z]\w*(?=\s+\w+\s*[;,=())])/
            ],
            'keyword': keywords,
            'function': [
                Prism.languages.clike.function,
                {
                    pattern: /(\:\:)[a-z_]\w*/,
                    lookbehind: true
                }
            ],
            'number': /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
            'operator': {
                pattern: /(^|[^.])(?:<<=?|>>>?=?|->|([-+&|])\2|[?:~]|[-+*/%&|^!=<>]=?)/m,
                lookbehind: true
            }
        });

        Prism.languages.insertBefore('java', 'class-name', {
            'annotation': {
                alias: 'punctuation',
                pattern: /(^|[^.])@\w+/,
                lookbehind: true
            },
            'namespace': {
                pattern: /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)[a-z]\w*(\.[a-z]\w*)+/,
                lookbehind: true,
                inside: {
                    'punctuation': /\./,
                }
            },
            'generics': {
                pattern: /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
                inside: {
                    'class-name': className,
                    'keyword': keywords,
                    'punctuation': /[<>(),.:]/,
                    'operator': /[?&|]/
                }
            }
        });
    }(Prism));

    /***********************************************
         Begin component prism-c.js
    ***********************************************/
    Prism.languages.c = Prism.languages.extend('clike', {
        'class-name': {
            pattern: /(\b(?:enum|struct)\s+)\w+/,
            lookbehind: true
        },
        'keyword': /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
        'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
        'number': /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
    });

    Prism.languages.insertBefore('c', 'string', {
        'macro': {
            // allow for multiline macro definitions
            // spaces after the # character compile fine with gcc
            pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
            lookbehind: true,
            alias: 'property',
            inside: {
                // highlight the path of the include statement as a string
                'string': {
                    pattern: /(#\s*include\s*)(?:<.+?>|("|')(?:\\?.)+?\2)/,
                    lookbehind: true
                },
                // highlight macro directives as keywords
                'directive': {
                    pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
                    lookbehind: true,
                    alias: 'keyword'
                }
            }
        },
        // highlight predefined macros as constants
        'constant': /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
    });

    delete Prism.languages.c['boolean'];

    /***********************************************
         Begin component prism-csharp.js
    ***********************************************/
    Prism.languages.csharp = Prism.languages.extend('clike', {
        'keyword': /\b(?:abstract|add|alias|as|ascending|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|descending|do|double|dynamic|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|from|get|global|goto|group|if|implicit|in|int|interface|internal|into|is|join|let|lock|long|namespace|new|null|object|operator|orderby|out|override|params|partial|private|protected|public|readonly|ref|remove|return|sbyte|sealed|select|set|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|value|var|virtual|void|volatile|where|while|yield)\b/,
        'string': [
            {
                pattern: /@("|')(?:\1\1|\\[\s\S]|(?!\1)[^\\])*\1/,
                greedy: true
            },
            {
                pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*?\1/,
                greedy: true
            }
        ],
        'class-name': [
            {
                // (Foo bar, Bar baz)
                pattern: /\b[A-Z]\w*(?:\.\w+)*\b(?=\s+\w+)/,
                inside: {
                    punctuation: /\./
                }
            },
            {
                // [Foo]
                pattern: /(\[)[A-Z]\w*(?:\.\w+)*\b/,
                lookbehind: true,
                inside: {
                    punctuation: /\./
                }
            },
            {
                // class Foo : Bar
                pattern: /(\b(?:class|interface)\s+[A-Z]\w*(?:\.\w+)*\s*:\s*)[A-Z]\w*(?:\.\w+)*\b/,
                lookbehind: true,
                inside: {
                    punctuation: /\./
                }
            },
            {
                // class Foo
                pattern: /((?:\b(?:class|interface|new)\s+)|(?:catch\s+\())[A-Z]\w*(?:\.\w+)*\b/,
                lookbehind: true,
                inside: {
                    punctuation: /\./
                }
            }
        ],
        'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)f?/i,
        'operator': />>=?|<<=?|[-=]>|([-+&|?])\1|~|[-+*/%&|^!=<>]=?/,
        'punctuation': /\?\.?|::|[{}[\];(),.:]/
    });

    Prism.languages.insertBefore('csharp', 'class-name', {
        'generic-method': {
            pattern: /\w+\s*<[^>\r\n]+?>\s*(?=\()/,
            inside: {
                function: /^\w+/,
                'class-name': {
                    pattern: /\b[A-Z]\w*(?:\.\w+)*\b/,
                    inside: {
                        punctuation: /\./
                    }
                },
                keyword: Prism.languages.csharp.keyword,
                punctuation: /[<>(),.:]/
            }
        },
        'preprocessor': {
            pattern: /(^\s*)#.*/m,
            lookbehind: true,
            alias: 'property',
            inside: {
                // highlight preprocessor directives as keywords
                'directive': {
                    pattern: /(\s*#)\b(?:define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\b/,
                    lookbehind: true,
                    alias: 'keyword'
                }
            }
        }
    });

    Prism.languages.dotnet = Prism.languages.csharp;

    /***********************************************
         Begin component prism-cpp.js
    ***********************************************/
    Prism.languages.cpp = Prism.languages.extend('c', {
        'class-name': {
            pattern: /(\b(?:class|enum|struct)\s+)\w+/,
            lookbehind: true
        },
        'keyword': /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
        'boolean': /\b(?:true|false)\b/,
        'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
    });

    Prism.languages.insertBefore('cpp', 'string', {
        'raw-string': {
            pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
            alias: 'string',
            greedy: true
        }
    });
});