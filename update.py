# Thanks to @Conlectus's WhoAmI for this

try:
    import urllib2 as request
except ImportError:
    from urllib import request

import json

interests = [
    'gaming',
    'architecture',
    'design',
    'politics',
    'art',
    'painting',
    'technology',
    'writing',
    'books',
    'engineering',
    'science',
    'economics',
    'history',
    'diy',
    'cooking',
    'movies',
    'television',
    'philosophy',
    'psychology',
    'sports',
    'programming'
]

all_interests = {}

for i, interest in enumerate(interests):
    print('Retreiving {}, ({} / {})'.format(interest, i + 1, len(interests)))

    url = 'http://feedly.com/v3/search/feeds?q='+interest+'&n=100'
    # python 2 return str, python 3 return bytes
    response = request.urlopen(url).read()
    if isinstance(response, bytes):
        response = response.decode('utf-8')
    results = json.loads(response)['results']

    all_interests[interest] = []

    for result in results:
        if 'website' in result:
            all_interests[interest].append(result['website'].rstrip('/'))


by_url = {}

for interest in all_interests:
    urls = all_interests[interest]
    for url in urls:
        if url not in by_url:
            by_url[url] = []

        if interest not in by_url[url]:
            by_url[url].append(interest)

with open('sites.json', 'w') as output:
    output.write(json.dumps(by_url))
