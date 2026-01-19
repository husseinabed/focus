import json
import os

def extract_translations(obj, lang, path=''):
    translations = {}
    if isinstance(obj, dict):
        if all(k in obj for k in ['he', 'en', 'ar']) and len(obj) == 3 and isinstance(obj.get(lang), str):
            translations[path] = obj[lang]
            return translations
        for k, v in obj.items():
            new_path = f'{path}.{k}' if path else k
            translations.update(extract_translations(v, lang, new_path))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            translations.update(extract_translations(item, lang, f'{path}.{i}'))
    return translations

def merge_dicts(d1, d2):
    for k, v in d2.items():
        if isinstance(v, dict) and k in d1 and isinstance(d1[k], dict):
            d1[k] = merge_dicts(d1[k], v)
        else:
            d1[k] = v
    return d1

# Load workflow editor JSON
with open('workflow_editor.json', 'r', encoding='utf-8') as f:
    workflow_editor_json = json.load(f)

locales = {'he': {}, 'en': {}, 'ar': {}}

for lang in locales.keys():
    locale_file_path = f'i18n/locales/{lang}.json'
    if os.path.exists(locale_file_path):
        with open(locale_file_path, 'r', encoding='utf-8') as f:
            try:
                locales[lang] = json.load(f)
            except json.JSONDecodeError:
                print(f'Warning: Could not decode {locale_file_path}. Starting with empty translations.')
                locales[lang] = {}

# Extract and merge for each language
for lang in ['he', 'en', 'ar']:
    extracted_translations = extract_translations(workflow_editor_json, lang)

    # Convert flattened dict to nested dict for merging
    new_translations_nested = {}
    for k, v in extracted_translations.items():
        parts = k.split('.')
        current = new_translations_nested
        for part_index, part in enumerate(parts):
            if part_index == len(parts) - 1: # Last part
                current[part] = v
            else:
                if part not in current or not isinstance(current[part], dict):
                    current[part] = {}
                current = current[part]

    locales[lang] = merge_dicts(locales[lang], new_translations_nested)

    print(f'---START_LOCALE_{lang.upper()}---')
    print(json.dumps(locales[lang], ensure_ascii=False, indent=2))
    print(f'---END_LOCALE_{lang.upper()}---')
