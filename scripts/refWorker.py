from pymongo import Connection
import pymongo
import string
import urllib
import time


server = 'ds063698-a0.mongolab.com'
port = 63698
db_name = 'heroku_app18544527'
username = 'artCoder'
password = 'zwamygogo'


def utcMilli():
    return int(round(time.time() * 1000))

def oneCycle(db):
    refMap = {}
    currTime = utcMilli()
    for chunck in db.gettyToAdd.find({},timeout=False):
        for image in chunck['images']:
            if image not in refMap:
                refMap[image] = 1
            else:
                refMap[image] += 1
            db.gettyImages.update({'id':image},{'$set':{'last_visit':currTime}})
            db.gettyToAdd.remove({'_id':chunck['_id']})
    
    for chunck in db.gettyToRemove.find({}, timeout=False):
        for image in chunck['images']:
            if image in refMap:
                refMap[image] -= 1
            else:
                refMap[image] = -1
            db.gettyToRemove.remove({'_id':chunck['_id']})
    
    
    for image in refMap:
        imageSet = db.gettyImages.find({'id':image})
        if imageSet.count() > 0:
            imageObj = imageSet[0]
            if 'refNum' not in imageObj:
                imageObj['refNum'] = refMap[imageObj['id']]
            else:
                imageObj['refNum'] += refMap[imageObj['id']]
            
            if imageObj['refNum'] < 0:
                imageObj['refNum'] = 0
            
            
            imageObj['refNum'] = int(imageObj['refNum'])
            
            db.gettyImages.update({'id':imageObj['id']},{'$set':{'refNum':imageObj['refNum'], 'refUpdate':int(round(time.time() * 1000))}})
            print imageObj['id'], imageObj['refNum']
            
            if not 'highRes' in imageObj:
                db.gettyToCheck.update({},{'$addToSet':{'images':imageObj['id']}})
    





def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
   
   
    #to do: add db error handler, since it is a long-running program
    while True:
       if db.gettyToAdd.count() == 0:
          print 'nothing to do, sleep...'
          time.sleep(2)
       else:
          print 'Start one cycle...'
          oneCycle(db)
          print 'One cycle done...'

    

    conn.close()
if __name__ == "__main__":
    main()