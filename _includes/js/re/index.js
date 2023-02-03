$(document).ready(function() {

    Handlebars.getTemplate = function(name) {
        if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined){
            $.ajax({
                url: 'templates/' + name + '.html',
                dataType: 'html',
                cache: true,
                success: function(data) {
                    if (Handlebars.templates === undefined) {
                        Handlebars.templates = {};
                    }
                    Handlebars.templates[name] = Handlebars.compile(data);
                },
                async: false
            });
        }
        return Handlebars.templates[name];
    };

    var context = {
        'home': 'https://www.realestate.if.ua',
        'siteHost': location.pathname === '/' && location.pathname !== '/add.php' ? location.protocol + '//' + location.host + '/' : location.protocol + '//' + location.host,
        'title': 'Подати безкоштовне оголошення про нерухомість · Мережа Вебсайтів Нерухомості',
        'region': 'Івано-Франківська область'
    };

    var template = Handlebars.getTemplate('head');
    $('title').replaceWith(template(context));
    var template = Handlebars.getTemplate('main');
    $('main').replaceWith(template(context));
    var template = Handlebars.getTemplate('header');
    $('main').before(template(context));
    var template = Handlebars.getTemplate('breadcrumbs');
    $('div.main-breadcrumbs').replaceWith(template(context));
    var template = Handlebars.getTemplate('alert-war');
    $('div.main-breadcrumbs').before(template(context));
    var template = Handlebars.getTemplate('head-form');
    $('#formre').before(template(context));
    var template = Handlebars.getTemplate('alert-info');
    $('p.lead').after(template(context));
    var template = Handlebars.getTemplate('footer');
    $('main').after(template(context));
    var template = Handlebars.getTemplate('modal-realestate');
    $('a.scroll-top').after(template(context));
    var template = Handlebars.getTemplate('modal-districts');
    $('a.scroll-top').after(template(context));
    var template = Handlebars.getTemplate('modal-surface-object');
    $('a.scroll-top').after(template(context));
    var template = Handlebars.getTemplate('modal-surface-land');
    $('a.scroll-top').after(template(context));
    var template = Handlebars.getTemplate('modal-cadastral-number');
    $('a.scroll-top').after(template(context));
    var siteHost = context['siteHost'];

    var data = {
        "actionRealestate": "none",
        "leaseTerm": "none",
        "typeRealestate": "none",
        "isLand": false,
        "settlement": "none",
        "surfaceObject": "4",
        "surfaceLand": "5",
        "cadastralNumber": "",
        "rooms": "1",
        "floor": "Нуль або більше",
        "floors": "Один або більше",
        "typeAddress": "none",
        "nameAddress": "До прикладу Симон Петлюра",
        "numberBuilding": "До прикладу 13 або 13А",
        "cities": "none",
        "districts": "none",
        "description": "Щось важливе...",
        "currency": "none",
        "price": "Десять або більше",
        "phone": "504949649",
        "firstName": "До прикладу Степан",
        "lastName": "До прикладу Бандери",
        "agreeRules": false
    };
    var schema = {
        "title": "Форма подання оголошення",
        "type": "object",
        "properties": {
            "actionRealestate": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "leaseTerm": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "typeRealestate": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "isLand": {
                "type": "boolean",
                "default": false
            },
            "surfaceObject": {
                "type": "number",
                "format":"number",
                "minimum": 4,
                "maximum": 9999,
                "minLength": 1,
                "maxLength": 4,
                "pattern": "^[0-9]{1,4}",
                "required": true
            },
            "surfaceLand": {
                "type": "number",
                "format":"number",
                "minimum": 5,
                "maximum": 9999,
                "minLength": 1,
                "maxLength": 4,
                "pattern": "^[0-9]{1,4}",
                "required": true
            },
            "cadastralNumber": {
                "type": "string",
                "format":"text",
                "required": true,
                "minLength": 22,
                "maxLength": 22,
                "pattern": "^[0-9]{10,10}:[0-9]{2,2}:[0-9]{3,3}:[0-9]{4,4}"
            },
            "reSurfaceLand": {
                "type": "number",
                "format":"number",
                "minimum": 5,
                "maximum": 9999,
                "minLength": 1,
                "maxLength": 4,
                "pattern": "^[0-9]{1,4}",
                "required": true
            },
            "reCadastralNumber": {
                "type": "string",
                "format":"text",
                "required": true,
                "minLength": 22,
                "maxLength": 22,
                "pattern": "^[0-9]{10,10}:[0-9]{2,2}:[0-9]{3,3}:[0-9]{4,4}"
            },
            "rooms": {
                "type": "number",
                "format":"number",
                "required": true,
                "minimum": 1,
                "maximum": 99,
                "minLength": 1,
                "maxLength": 2,
                "pattern": "^[1-9]{1,2}"
            },
            "floor": {
                "type": "number",
                "format":"number",
                "required": true,
                "minimum": 0,
                "maximum": 48,
                "minLength": 1,
                "maxLength": 2,
                "pattern": "^[0-9]{1,2}"
            },
            "floors": {
                "type": "number",
                "format":"number",
                "required": true,
                "minimum": 1,
                "maximum": 48,
                "minLength": 1,
                "maxLength": 2,
                "pattern": "^[1-9]{1,2}"
            },
            "typeAddress": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "nameAddress": {
                "type": "string",
                "required": true,
                "minLength": 2,
                "maxLength": 30,
                "pattern": "^[^\\s-][1-9]?[0-9]{0,3}[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ\\s-]{0,26}[^\\s-]$"
            },
            "numberBuilding": {
                "type": "string",
                "required": true,
                "minLength": 1,
                "maxLength": 4,
                "pattern": "^[1-9]{1,1}[0-9]{0,2}[^абвгґдеєжзиіїйклмноп]{0}[АБВГҐДЕЄЖЗИІЇЙКЛМНОП]?$"
            },
            "settlement": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "nameSettlement": {
                "type": "string",
                "minLength": 3,
                "maxLength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ-]{3,30}[^\\s-]{0}$",
                "required": true
            },
            "cities": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "districts": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "description": {
                "type": "string",
                "minlength": 0,
                "maxLength": 256,
                "pattern": "^[^\\s-][0-9а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ\\s-]{0,256}[^\\s-]$",
                "required": false
            },
            "currency": {
                "type": "string",
                "required": true,
                "default": "none"
            },
            "price": {
                "type": "number",
                "format":"number",
                "minimum": 10,
                "maximum": 999999999,
                "minLength": 2,
                "maxLength": 9,
                "pattern": "^[0-9]{2,9}",
                "required": true
            },
            "phone": {
                "type": "number",
                "format":"phone",
                "minLength": 9,
                "maxLength": 9,
                "pattern": "^[0-9]{9,9}",
                "required": true
            },
            "firstName": {
                "type": "string",
                "minLength": 2,
                "maxLength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ]{2,30}$",
                "required": true
            },
            "lastName": {
                "type": "string",
                "minLength": 3,
                "maxLength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ]{3,30}$",
                "required": true
            },
            "agreeRules": {
                "type": "boolean",
                "required": true,
                "default": false
            }
        },
        "dependencies": {
            "actionRealestate": ["agreeRules"],
            "leaseTerm": ["agreeRules","actionRealestate"],
            "typeRealestate": ["agreeRules"],
            "isLand": ["agreeRules","typeRealestate"],
            "surfaceObject": ["agreeRules","typeRealestate"],
            "surfaceLand": ["agreeRules","typeRealestate"],
            "cadastralNumber": ["agreeRules","typeRealestate"],
            "reSurfaceLand": ["agreeRules","isLand"],
            "reCadastralNumber": ["agreeRules","isLand"],
            "rooms": ["agreeRules","typeRealestate"],
            "floor": ["agreeRules","typeRealestate"],
            "floors": ["agreeRules","typeRealestate"],
            "typeAddress": ["agreeRules","typeRealestate"],
            "nameAddress": ["agreeRules","typeRealestate"],
            "numberBuilding": ["agreeRules","typeRealestate"],
            "settlement": ["agreeRules"],
            "nameSettlement": ["agreeRules","settlement"],
            "cities": ["agreeRules","settlement"],
            "districts": ["agreeRules","settlement"],
            "description": ["agreeRules"],
            "currency": ["agreeRules"],
            "price": ["agreeRules"],
            "phone": ["agreeRules"],
            "firstName": ["agreeRules"],
            "lastName": ["agreeRules"],
            "photoFiles": ["agreeRules"],
            "submit": ["agreeRules"]
        }
    };
    var options = {
        "fields": {
            "actionRealestate": {
                "type": "select",
                "label": "Дія з вашим об\'єктом нерухмості",
                "noneLabel": "Виберіть дію...",
                "dataSource": siteHost + "data/action-realestate.json",
                "events": {
                    "change": function() {
                        var thisId = this.parent.childrenByPropertyId,
                            price = thisId["price"],
                            firstName = thisId["firstName"],
                            lastName = thisId["lastName"],
                            phone = thisId["phone"],
                            actionRealestateVal = this.getValue();
                        if ( actionRealestateVal === 'rent' ) {
                            price.options.label = "Вартість оренди";
                            firstName.options.label = "Ім\'я орендодавця";
                            lastName.options.label = "Прізвище орендодавця";
                            phone.options.label = "Номер телефону орендодавця";
                        } else {
                            price.options.label = "Вартість всього об\'єкту нерухомості";
                            firstName.options.label = "Ім\'я продавця";
                            lastName.options.label = "Прізвище продавця";
                            phone.options.label = "Номер телефону продавця";
                        }
                        if ( actionRealestateVal !== '' && actionRealestateVal !== 'none' ) {
                            price.refresh();
                            firstName.refresh();
                            lastName.refresh();
                            phone.refresh();
                        }
                        $("span.alpaca-required-indicator").html("(це поле є обов\'язкове)");
                    },
                    "focus": function() {
                        var thisId = this.parent.childrenByPropertyId,
                            price = thisId["price"],
                            firstName = thisId["firstName"],
                            lastName = thisId["lastName"],
                            phone = thisId["phone"];
                        price.refresh();
                        firstName.refresh();
                        lastName.refresh();
                        phone.refresh();
                        $("span.alpaca-required-indicator").html("(це поле є обов\'язкове)");
                    }
                },
                "sort": false,
                "removeDefaultNone": false,
                "focus": "typeRealestate",
                "validate": true
            },
            "leaseTerm": {
                "type": "select",
                "label": "Період оренди",
                "noneLabel": "Виберіть період оренди...",
                "dataSource": siteHost + "data/lease-term.json",
                "removeDefaultNone": false,
                "sort": false,
                "dependencies": {
                    "actionRealestate": ["rent"]
                },
                "events": {
                    "click": function() {
                        var price = this.parent.childrenByPropertyId["price"],
                            leaseTerm = this.getValue();
                        if ( leaseTerm === 'day' ) {
                            price.options.label = "Вартість оренди за добу";
                        } else if ( leaseTerm === 'month' ) {
                            price.options.label = "Вартість оренди за місяць";
                        } else if ( leaseTerm === 'year' ) {
                            price.options.label = "Вартість довготривалої оренди (за місяць)";
                        } else {
                            price.options.label = "Вартість оренди (за місяць)";
                        }
                        price.refresh();
                        $("span.alpaca-required-indicator").html("(це поле є обов\'язкове)");
                    }
                },
                "removeDefaultNone": false,
                "validate": true
            },
            "typeRealestate": {
                "type": "select",
                "label": "Тип об\'єкту нерухомості",
                "noneLabel": "Виберіть тип вашої нерухомості...",
                "dataSource": siteHost + "data/type-realestate.json",
                "events": {
                    "change": function() {
                        var isLand = this.parent.childrenByPropertyId["isLand"],
                            typeRealestateValue = this.getValue();
                        if ( typeRealestateValue !== 'house' && typeRealestateValue !== 'land' ) {
                            isLand.setValue('');
                        }
                    }
                },
                "removeDefaultNone": false,
                "validate": true
            },
            "isLand": {
                "type": "checkbox",
                "rightLabel": "У цього об\'єкта нерухомсті є земля",
                "dependencies": {
                    "typeRealestate": ["parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking"]
                }
            },
            "surfaceObject": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Загальна площа м<sup>2</sup> у об\'єкта нерухомості",
                "placeholder": "Від 4 до 9999",
                "minlength": 1,
                "maxlength": 4,
                "min": 4,
                "max": 9999,
                "pattern": "^[0-9]{1,4}",
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<small><b>м<sup>2</sup></b></small>",
                    "target": "surfaceObject"

                },
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking"]
                },
                "validate": true
            },
            "surfaceLand": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Загальна площа м<sup>2</sup> землі",
                "placeholder": "Від 5 і більше",
                "minlength": 1,
                "maxlength": 9,
                "min": 5,
                "max": 999999999,
                "pattern": "^[0-9]{1,9}",
                "dependencies": {
                    "typeRealestate": ["house","land"]
                },
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<small><b>м<sup>2</sup></b></small>",
                    "target": "surfaceLand"
                },
                "validate": true
            },
            "cadastralNumber": {
                "type": "text",
                "label": "Кадастровий номер землі",
                "minlength": 22,
                "maxlength": 22,
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<b>i</b>",
                    "target": "cadastralNumber"
                },
                "placeholder": "XXXXXXXXXX:XX:XXX:XXXX",
                "pattern": "^[0-9]{10,10}:[0-9]{2,2}:[0-9]{3,3}:[0-9]{4,4}",
                "dependencies": {
                    "typeRealestate": ["house","land"]
                },
                "validate": true
            },
            "reSurfaceLand": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Загальна площа м<sup>2</sup> землі",
                "placeholder": "Від 5 і більше",
                "minlength": 1,
                "maxlength": 8,
                "min": 5,
                "max": 99999999,
                "pattern": "^[0-9]{1,8}",
                "dependencies": {
                    "isLand": true
                },
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<small><b>м<sup>2</sup></b></small>",
                    "target": "surfaceLand"
                },
                "validate": true
            },
            "reCadastralNumber": {
                "type": "text",
                "label": "Кадастровий номер землі",
                "minlength": 22,
                "maxlength": 22,
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<b>i</b>",
                    "target": "cadastralNumber"
                },
                "placeholder": "XXXXXXXXXX:XX:XXX:XXXX",
                "pattern": "^[0-9]{10,10}:[0-9]{2,2}:[0-9]{3,3}:[0-9]{4,4}",
                "dependencies": {
                    "isLand": true
                },
                "validate": true
            },
            "rooms": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Кількість кімнат у об\'єкта нерухомості",
                "placeholder": "Щонайменше одна кімната чи одне приміщення",
                "minlength": 1,
                "maxlength": 2,
                "min": 1,
                "max": 99,
                "pattern": "^[1-9]{1,9}",
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","nonresidential","commercial","garage"]
                },
                "validate": true
            },
            "floor": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "На якому поверсі знаходиться об\'єкт нерухомості",
                "placeholder": "0 це підвал",
                "minlength": 1,
                "maxlength": 2,
                "min": 0,
                "max": 48,
                "pattern": "^[0-9]{1,2}",
                "dependencies": {
                    "typeRealestate": ["parthouse","apartment","partapartment","separateroom","nonresidential","commercial","parking"]
                },
                "validate": true
            },
            "floors": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Кількість поверхів у споруді",
                "placeholder": "Щонайменше один поверх",
                "minlength": 1,
                "maxlength": 2,
                "min": 1,
                "max": 48,
                "pattern": "^[1-9]{1,2}",
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking"]
                },
                "validate": true
            },
            "typeAddress": {
                "type": "select",
                "label": "Тип адреси",
                "noneLabel": "Виберіть тип адреси...",
                "dataSource": siteHost + "data/type-address.json",
                "removeDefaultNone": false,
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking","land"]
                },
                "validate": true
            },
            "nameAddress": {
                "type": "text",
                "label": "Найменування адреси",
                "placeholder": "До прикладу Степана Бандери або 30-річчя Незалежності",
                "minlength": 2,
                "maxlength": 30,
                "pattern": "^[^\\s-][1-9]?[0-9]{0,3}[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ\\s-]{0,26}[^\\s-]$",
                //"pattern": "^([^\\s-][^A-Za-z]{0}[0-9'а-щА-ЩЬьЮюЯяЇїІіЄєҐґ\\s-][^A-Za-z]{0}[^\\s-]+){0,3}$",
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking","land"]
                },
                "validate": true
            },
            "numberBuilding": {
                "type": "text",
                "label": "Номер будинку",
                "placeholder": "До прикладу 13 або 99Б",
                "minlength": 1,
                "maxlength": 4,
                "pattern": "^[1-9]{1,1}[0-9]{0,2}[^абвгґдеєжзиіїйклмноп]{0}[АБВГҐДЕЄЖЗИІЇЙКЛМНОП]?$",
                "spellcheck": false,
                "dependencies": {
                    "typeRealestate": ["house","parthouse","apartment","partapartment","separateroom","nonresidential","commercial","garage","parking","land"]
                },
                "validate": true
            },
            "settlement": {
                "type": "select",
                "label": "Тип населеного пукту",
                "noneLabel": "Виберіть тип вашого населеного пукту...",
                "dataSource": siteHost + "data/settlement.json",
                "removeDefaultNone": false,
                "validate": true
            },
            "nameSettlement": {
                "type": "text",
                "label": "Найменування населеного пункту",
                "placeholder": "До прикладу Хом\'яківка або Ворохта",
                "minlength": 3,
                "maxlength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ-]{3,30}[^\\s-]{0}$",
                "dependencies": {
                    "settlement": ["townvillage","bigvillage","village","smallvillage"]
                },
                "validate": true
            },
            "cities": {
                "type": "select",
                "label": "Місто",
                "noneLabel": "Виберіть місто у цьому списку",
                "dataSource": siteHost + "data/cities.json",
                "removeDefaultNone": false,
                "sort": true,
                "dependencies": {
                    "settlement": ["citytown"]
                },
                "validate": true
            },
            "districts": {
                "type": "select",
                "label": "Район",
                "noneLabel": "Виберіть район у цьому списку",
                "dataSource": siteHost + "data/districts.json",
                "removeDefaultNone": false,
                "sort": false,
                "dependencies": {
                    "settlement": ["townvillage","bigvillage","village","smallvillage"]
                },
                "suffix": {
                    "show": true,
                    "title": "Інформаційна довідка",
                    "text": "<b>i</b>",
                    "target": "districts"
                },
                "validate": true
            },
            "description": {
                "type": "textarea",
                "label": "Додатковий опис нерухомість",
                "minlength": 0,
                "maxlength": 256,
                "pattern": "^[^\\s-][0-9а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ\\s-]{0,256}[^\\s-]$",
                "showMaxLengthIndicator": true,
                "validate": true
            },
            "currency": {
                "type": "select",
                "label": "Валюта",
                "noneLabel": "Виберіть валюту...",
                "dataSource": siteHost + "data/currency.json",
                "fieldClass": "field-select",
                "removeDefaultNone": false,
                "sort": false,
                "validate": true
            },
            "price": {
                "type": "number",
                "inputType": "text",
                "inputmode": "numeric",
                "label": "Вартість всього об\'єкту нерухомості",
                "minlength": 2,
                "maxlength": 9,
                "min": 10,
                "max": 999999999,
                "pattern": "^[0-9]{2,9}",
                "validate": true
            },
            "phone": {
                "type": "phone",
                "inputType": "tel",
                "inputmode": "numeric",
                "label": "Номер телефону продавця",
                "placeholder": "504949649",
                "maskString": "",
                "minlength": 9,
                "maxlength": 9,
                "min": 9,
                "max": 9,
                "pattern": "^[0-9]{9,9}",
                "prefix": {
                    "show": true,
                    "text": "+380",
                    "class": "text",
                    "id": "Phone"
                },
                "validate": true
            },
            "firstName": {
                "type": "text",
                "label": "Ім\'я продавця",
                "placeholder": "До прикладу Степан або Тарас",
                "minlength": 2,
                "maxlength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ-]{2,30}[^\\s-]{0}$",
                "validate": true
            },
            "lastName": {
                "type": "text",
                "label": "Прізвище продавця",
                "placeholder": "До прикладу Бандера або Шевченко",
                "minlength": 3,
                "maxlength": 30,
                "pattern": "[а-щ'А-ЩЬьЮюЯяЇїІіЄєҐґ-]{3,30}[^\\s-]{0}$",
                "validate": true
            },
            "agreeRules": {
                "type": "checkbox",
                //"label": "Прийміть <a href=\"https://www.realestate.if.ua/terms-and-conditions\" target=\"_blank\">правила і умови використання</a>",
                "rightLabel": "Я погоджуюсь з <a href=\"https://www.realestate.if.ua/terms-and-conditions\" target=\"_blank\">правилами і умовами використання</a>",
                //"fieldClass": "custom-checkbox",
                "focus": "actionRealestate",
                "validate": true
            }
        },
        "focus": "agreeRules",
        "form": {
            "attributes": {
                "method": "POST",
                "action": siteHost + "add.php",
                "enctype": "multipart/form-data"
            },
            "buttons": {
                "submit": {
                    "value": "add",
                    "styles": "btn btn-primary",
                    "title": "Надіслати оголошення"
                }
            }
        },
        "helper": "Отримані нами дані призначені виключно для формування і булікації вашого оголошення на цьому вебсайті"
    };
    var postRenderCallback = function(field) {
        var buttonSubmit = $("button.alpaca-form-button-submit"),
            legendLabel = $("legend.alpaca-container-label").addClass("d-none");
        $(field.getContainerEl()).bind("fieldupdate", function() {
            $("span.alpaca-required-indicator").html("(це поле є обов\'язкове)");
            var value = field.getValue();
            if (value.agreeRules){
                legendLabel.removeClass("d-none");
                buttonSubmit.removeClass("d-none");
                buttonSubmit.removeAttr("hidden",null);
                $("div.alert-info").addClass("d-none");
                $("div.alpaca-top p.help-block").removeClass("d-none");
            } else {
                legendLabel.addClass("d-none");
                buttonSubmit.addClass("d-none");
                buttonSubmit.attr("hidden",null);
                $("div.alpaca-top p.help-block").addClass("d-none");
                $("div.alert-info").removeClass("d-none");
            }
        });
        buttonSubmit.attr("hidden","");
        buttonSubmit.addClass("d-none");
        $("div.alpaca-top p.help-block").addClass("d-none");
        $("span.alpaca-required-indicator").html("(це поле є обов\'язкове)");
    };
    Alpaca.registerView({
        "id": "realestate",
        "parent": "bootstrap-create",
        "messages": {
            "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Поточне значення у цьому полі є: {1}",
            "invalidPhone": "Будь ласка введіть дійсний номер телефону."
        },
        "templates": {
            "control-checkbox": siteHost + "templates/control-checkbox.html",
            "control-text": "<input id=\"{{id}}\"{{#if options.fieldClass}} class=\"{{options.fieldClass}}\"{{/if}}{{#if options.type}}{{#if options.inputType}} type=\"{{options.inputType}}\"{{else}} type=\"{{options.type}}\"{{/if}}{{else}} type=\"text\"{{/if}}{{#if options.inputmode}} inputmode=\"{{options.inputmode}}\"{{/if}}{{#if options.min}} min=\"{{options.min}}\"{{/if}}{{#if options.max}} max=\"{{options.max}}\"{{/if}}{{#if options.minlength}} minlength=\"{{options.minlength}}\"{{/if}}{{#if options.maxlength}} maxlength=\"{{options.maxlength}}\"{{/if}}{{#if options.pattern}} pattern=\"{{options.pattern}}\"{{/if}}{{#if options.placeholder}} placeholder=\"{{options.placeholder}}\"{{/if}}{{#if options.size}} size=\"{{options.size}}\"{{/if}}{{#if options.readonly}} readonly=\"readonly\"{{/if}}{{#if name}} name=\"{{name}}\"{{/if}}{{#each options.data}} data-{{@key}}=\"{{this}}\"{{/each}}/>",
            "control-file": "<input type=\"file\" id=\"{{id}}\"{{#if options.accept}} accept=\"{{options.accept}}\"{{/if}}{{#if options.size}} size=\"{{options.size}}\"{{/if}}{{#if options.readonly}} readonly=\"readonly\"{{/if}}{{#if name}} name=\"{{name}}\"{{/if}}{{#each options.data}} data-{{@key}}=\"{{this}}\"{{/each}}/>",
            "message": siteHost + "templates/message.html",
            "control": siteHost + "templates/control.html"
        },
        "fields": {
            "/actionRealestate": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодної. Будь ласка виберіть дію.",
                    "notOptional": "Ви не обрали жодної дії. Будь ласка виберіть дію."
                }
            },
            "/leaseTerm": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодної. Будь ласка виберіть період оренди.",
                    "notOptional": "Ви не обрали жодного періоду оренди. Будь ласка виберіть період оренди."
                }
            },
            "/typeRealestate": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодного. Будь ласка виберіть тип нерухомості.",
                    "notOptional": "Ви не обрали жодного типу нерухомості. Будь ласка виберіть тип нерухомості."
                }
            },
            "/surfaceObject": {
                "messages": {
                    "notOptional": "Ви не ввели загальну площу м<sup>2</sup> вашого об\'єкта нерухомості.<br/>Будь ласка введіть загальну площу м<sup>2</sup> вашого об\'єкта нерухомості.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0}.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є кількістю м<sup>2</sup> площі нерухомості.<br/>Це поле має містити площу у м<sup>2</sup> у цифровому форматі.<br/>Будь ласка введіть загальну площу м<sup>2</sup> нерухомості.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальна кількість площі має бути {0} м<sup>2</sup>.",
                    "stringValueTooLarge": "Максимальне кількість площі має бути {0} м<sup>2</sup>."
                }
            },
            "/surfaceLand": {
                "messages": {
                    "notOptional": "Ви не ввели загальну площу м<sup>2</sup> землі. Будь ласка введіть загальну площу м<sup>2</sup> землі.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0} м<sup>2</sup>.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є кількістю м<sup>2</sup> площі землі.<br/>Це поле має містити площу землі у м<sup>2</sup> у цифровому форматі.<br/>Будь ласка введіть загальну площу м<sup>2</sup> землі.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальна кількість площі землі має бути {0} м<sup>2</sup>.",
                    "stringValueTooLarge": "Максимальне кількість площі землі має бути {0} м<sup>2</sup>."
                }
            },
            "/cadastralNumber": {
                "messages": {
                    "invalidPattern": "Це поле має містити дані за таким шаблоном 'XXXXXXXXXX:XX:XXX:XXXX', замініть символи 'Х' на цифри.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифр і у тому числі символ ':'.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифр і у тому числі символ ':'.",
                    "notOptional": "Ви не ввели кадастровий номер землі. Будь ласка введіть кадастровий номер на зразок цього '8000000000:69:033:0001'."
                }
            },
            "/reSurfaceLand": {
                "messages": {
                    "notOptional": "Ви не ввели загальну площу м<sup>2</sup> землі. Будь ласка введіть загальну площу м<sup>2</sup> землі.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0} м<sup>2</sup>.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є кількістю м<sup>2</sup> землі.<br/>Це поле має містити площу землі у м<sup>2</sup> у цифровому форматі.<br/>Будь ласка введіть загальну площу м<sup>2</sup> землі.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальна кількість площі землі має бути {0} м<sup>2</sup>.",
                    "stringValueTooLarge": "Максимальне кількість площі землі має бути {0} м<sup>2</sup>."
                }
            },
            "/reCadastralNumber": {
                "messages": {
                    "invalidPattern": "Це поле має містити дані за таким шаблоном 'XXXXXXXXXX:XX:XXX:XXXX', замініть символи 'Х' на цифри.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифр і у тому числі символ ':'.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифр і у тому числі символ ':'.",
                    "notOptional": "Ви не ввели кадастровий номер землі. Будь ласка введіть кадастровий номер на зразок цього '8000000000:69:033:0001'."
                }
            },
            "/rooms": {
                "messages": {
                    "notOptional": "Ви не ввели кількість кімнат, яка є у об\'єкта нерухомості.<br/>Будь ласка введіть дійсну кількість кімнат, яка є у об\'єкта нерухомості.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0}.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є кількістю кімнат.<br/>Це поле має містити кількість кімнат у цифровому форматі.<br/>Будь ласка введіть кількість кімнат.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальне значення для цього поля становить {0}.",
                    "stringValueTooLarge": "Максимальне значення для цього поля становить {0}."
                }
            },
            "/floor": {
                "messages": {
                    "notOptional": "Ви не ввели поверх на якому знаходиться об\'єкт нерухомості.<br/>Будь ласка введіть поверх на якому знаходиться об\'єктом нерухомості.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0}.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є цифровим значенням поверху.<br/>Це поле має містити цифрове значення поверху.<br/>Будь ласка введіть поверх на якому знаходиться об\'єктом нерухомості.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальне значення для цього поля становить {0}.",
                    "stringValueTooLarge": "Максимальне значення для цього поля становить {0}."
                }
            },
            "/floors": {
                "messages": {
                    "notOptional": "Ви не ввели кількість поверхів, які є у будинку чи будівлі.<br/>Будь ласка введіть кількість поверхів, які є у будинку чи будівлі.",
                    "notEnoughItems": "Мінімальне цифрове значення у цьому полі не менше {0}.",
                    "invalidPattern": "Це поле має містити тільки дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є цифровим значенням кількістю поверхів.<br/>Це поле має містити цифрове значення кількості поверхів.<br/>Будь ласка введіть кількість поверхів, які є у будинку чи будівлі.",
                    "stringTooShort": "Це поле має містити щонайменше {0} цифровий символ.",
                    "stringTooLong": "Це поле має містити щонайбільше {0} цифрових символів.",
                    "stringValueTooSmall": "Мінімальне значення для цього поля становить {0}.",
                    "stringValueTooLarge": "Максимальне значення для цього поля становить {0}."
                }
            },
            "/typeAddress": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодного",
                    "notOptional": "Ви не обрали жодного типу адреси. Будь ласка виберіть тип адреси."
                }
            },
            "/nameAddress": {
                "messages": {
                    "invalidPattern": "Це поле має містити найменування адреси, на зразок цього 'Тараса Шевченка або Степана Бандери чи 30-річчя Незалежності України'",
                    "notOptional": "Ви не ввели найменування адреси. Будь ласка введіть дійсне найменування адреси.",
                    "stringTooShort": "Це поле має містити щонайменше {0} символи",
                    "stringTooLong": "Це поле має містити щонайбільше {0} символів"
                }
            },
            "/numberBuilding": {
                "messages": {
                    "notOptional": "Ви не ввели номер будинку. Будь ласка введіть дійсний номер будинку.",
                    "invalidPattern": "Це поле має містити номер будинку, на зразок цього '100 або 48А'",
                    "stringTooShort": "Це поле має містити щонайменше {0} символ",
                    "stringTooLong": "Це поле має містити щонайбільше {0} символів"
                }
            },
            "/settlement": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодного. Будь ласка виберіть тип населеного пункту.",
                    "notOptional": "Ви не обрали жодного типу населеного пункту. Будь ласка виберіть тип населеного пункту."
                }
            },
            "/nameSettlement": {
                "messages": {
                    "invalidPattern": "Це поле має містити найменування населеного пункту українською,<br/>на зразок цього \"Хом'яківка\" або \"Горішнє Залуччя\" чи \"Баня-Березів\"",
                    "notOptional": "Ви не ввели найменування населеного пункту.<br/>Будь ласка введіть дійсне найменування населеного пункту.",
                    "stringTooShort": "Це поле має містити щонайменше {0} символи",
                    "stringTooLong": "Це поле має містити щонайбільше {0} символів"
                }
            },
            "/cities": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодного. Будь ласка виберіть місто.",
                    "notOptional": "Ви не вибрали жодного міста. Будь ласка виберіть місто."
                }
            },
            "/districts": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодного. Будь ласка виберіть район.",
                    "notOptional": "Ви не обрали жодного району. Будь ласка виберіть район."
                }
            },
            "/description": {
                "messages": {
                    "stringTooShort": "Це поле має містити щонайменше {0} символів",
                    "stringTooLong": "Це поле має містити не більше {0} символів",
                    "invalidPattern": "Це поле має містити текст українською мовою"
                }
            },
            "/currency": {
                "messages": {
                    "invalidValueOfEnum": "У цьому полі має бути одне зі значень {0}. Наразі ви не вибрали жодної. Будь ласка виберіть валюту.",
                    "notOptional": "Ви не вибрали жодної валюти. Будь ласка виберіть валюту."
                }
            },
            "/price": {
                "messages": {
                    "notOptional": "Ви не ввели ціну. Будь ласка введіть ціну.",
                    "notEnoughItems": "Мінімальне значення у цьому полі не менше {0}.",
                    "invalidPattern": "Це поле має містити дані з цифрами.",
                    "stringNotANumber": "Те що ви ввели не є ціною.<br/>Це поле має містити ціну у цифровому форматі.<br/>Будь ласка введіть ціну.",
                    "stringTooShort": "Це поле має містити ціну у цифровому форматі і щонайменше {0}-ва цифрових символа.",
                    "stringTooLong": "Це поле має містити ціну у цифровому форматі і щонайбільше {0}-ть цифрових символів."
                }
            },
            "/phone": {
                "messages": {
                    "stringTooShort": "Це поле має містити номер телефону у цифровому форматі і щонайменше {0} цифр.",
                    "stringTooLong": "Це поле має містити номер телефону у цифровому форматі і щонайбільше {0} цифр",
                    "notOptional": "Ви не ввели номер телефону. Будь ласка введіть номер телефону inputType."
                }
            },
            "/firstName": {
                "messages": {
                    "notOptional": "Ви не ввели ім\'я. Будь ласка введіть ім\'я.",
                    "invalidPattern": "Це поле має містити ім\'я українською,<br/>на зразок цього 'Ян або Володимир чи Василь'",
                    "stringTooShort": "Це поле має містити щонайменше {0} символи",
                    "stringTooLong": "Це поле має містити щонайбільше {0} символи"
                }
            },
            "/lastName": {
                "messages": {
                    "notOptional": "Ви не ввели прізвище. Будь ласка введіть прізвище.",
                    "invalidPattern": "Це поле має містити прізвище українською,<br/>на зразок цього \"Бандера\" або \"Вуж\" чи \"Ґут-Кульчицький\"",
                    "stringTooShort": "Це поле має містити щонайменше {0} символи",
                    "stringTooLong": "Це поле має містити щонайбільше {0} символи"
                }
            },
            "/agreeRules": {
                "messages": {
                    "invalidValueOfEnum": "Ви повинні погодитись з правилами і умовами використання",
                    "notOptional": "Якщо ви не погодитесь з правилами і умовами використання, ви не зможете додати своє оголошення."
                }
            }
        }
    });
    $('#formre').alpaca({
        'data': data,
        'schema': schema,
        'options': options,
        'postRender': postRenderCallback,
        'view': 'realestate',
        'type': 'create'
    });

});