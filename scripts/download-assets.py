import urllib.request, concurrent.futures, json
from pathlib import Path
root=Path('public/assets'); root.mkdir(parents=True,exist_ok=True)
posters={'dune':'1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg','interstellar':'gEU2QniE6E77NI6lCU6MxlNBvIx.jpg','pastlives':'k3waqVXSnvCZWfJYNtdamTgTtTA.jpg','poor':'kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg','spiderverse':'8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg','oppenheimer':'ptpr0kGAckfQkJeJIt8st5dglvd.jpg','budapest':'eWdyYQreja6JGCzqHWXpWHDrrPo.jpg','whiplash':'7fn624j5lj3xTme2SgiLCeuedmO.jpg','lalaland':'uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg','parasite':'7IiTTgloJzvGI1TAYymCfbfl3vT.jpg','batman':'74xTEgt7R36Fpooo50r9T25onhq.jpg','everything':'w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg','spirited':'39wmItIWsg5sZMyRUHLkWBcuVCM.jpg','arrival':'x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg','before':'kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg','fightclub':'pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg','inception':'oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg','paperman':'p0DU8S3vIycR3nGGCiNWo5l0KPk.jpg'}
sources={k:'https://image.tmdb.org/t/p/w500/'+v for k,v in posters.items()}
sources.update({k:'https://image.tmdb.org/t/p/w1280/'+v for k,v in {'dune-bg':'xOMo8BRK7PfcJvWaK8yHj8onT2K.jpg','interstellar-bg':'xJHokMbljvjADYdit5fK5VQsXEG.jpg','batman-bg':'b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg','lalaland-bg':'nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg'}.items()})
for i,id in enumerate(['photo-1534528741775-53994a69daeb','photo-1500648767791-00dcc994a43e','photo-1524504388940-b1c1722653e1','photo-1506794778202-cad84cf45f1d','photo-1524250502761-1ac6f2e30d43','photo-1506794778202-cad84cf45f1d']): sources['avatar'+str(i+1)]=f'https://images.unsplash.com/{id}?auto=format&fit=crop&w=160&h=160&q=85'
sources.update({'cast-timothée':'https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg','cast-zendaya':'https://image.tmdb.org/t/p/w185/tylFhQNsDwkwhUkLCv7F8RxCFrv.jpg','cast-florence':'https://image.tmdb.org/t/p/w185/fQe8GQ5tFFLrLQeR9GCwCJVi5Ri.jpg','cast-austin':'https://image.tmdb.org/t/p/w185/5VDRdkVxEJ0bFqej8Y7CJ3Hjz2j.jpg'})
manifest=Path('public/assets/sources.json')
if manifest.exists(): sources=json.loads(manifest.read_text(encoding='utf-8-sig'))

def get(item):
 key,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 Cine prototype'})
  with urllib.request.urlopen(req, timeout=25) as res: data=res.read()
  if len(data)<1000: raise ValueError('empty image')
  (root/(key+'.jpg')).write_bytes(data)
  return key,True
 except Exception as e: return key,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for result in pool.map(get,sources.items()): print(result)
Path('public/assets/sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
