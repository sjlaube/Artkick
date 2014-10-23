from pymongo import Connection
import pymongo
import string
import httplib, urllib, urllib2
import re, urlparse
import time
import json
import Image
from boto.s3.connection import S3Connection
import cStringIO
import Queue
import threading


server = 'ds063698-a0.mongolab.com'
port = 63698
db_name = 'heroku_app18544527'
username = 'artCoder'
password = 'zwamygogo'

client_key = 'szhgrwdtzhqhyn86myhcpa32'
client_secret = '35WjyVWVbbEEVABcxFpjNysMGXRmSVVxn8by3p3bAwfgB'
getty_user = 'artkick_photos_api'
getty_pswd = 'rSxzm3uVWaoZpHb'



token = ""

#S3 storage
myKey = "AKIAIA2YFFGUFIQLTX2A"
mySecretKey = "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"
myBucket = 'artkickbucket1'


def utcMilli():
    return int(round(time.time() * 1000))

def iriToUri(iri):
    parts= urlparse.urlparse(iri)
    return urlparse.urlunparse(
       part.encode('idna') if parti==1 else urlEncodeNonAscii(part.encode('utf-8'))
       for parti, part in enumerate(parts)
    )

def urlEncodeNonAscii(b):
    return re.sub('[\x80-\xFF]', lambda c: '%%%02x' % ord(c.group(0)), b)

def oauth():
   params = {'client_id': client_key, 'client_secret': client_secret,
                             'grant_type':'password', 'username':getty_user,
                             'password':getty_pswd}
                             
   url = "https://connect.gettyimages.com/oauth2/token/"
   data = urllib.urlencode(params)
   req = urllib2.Request(url, data)
   res = urllib2.urlopen(req)
   result = json.loads(res.read())
   global token
   token = result['access_token']
   print token



def postJson(url, jsonData):
   jsonStr = json.dumps(jsonData)
   req = urllib2.Request(url, jsonStr, headers={'Content-Type':'application/json','Accept':'application/json'})
   res = urllib2.urlopen(req)
   result = json.loads(res.read())
   return result



def getBucket():
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)
    return bucket



def getAssetChanges(channelId):
    print "get changes"
    endpoint = "https://connect.gettyimages.com/v1/partnerassetingestion/GetAssetChanges"
    jsonData = {
       'RequestHeader':{'Token':token},
       'GetAssetChangesRequestBody':{
           'ChannelId':channelId,
           'ItemCount':100
        }
    }
        

    result = postJson(endpoint,jsonData)
    print result
    if result['ResponseHeader']['Status'] == 'error':
       oauth()
       return postJson(endpoint, jsonData)
    else:
       return result

def confirmChanges(transactionId):
    print "confirm changes"
    endpoint = "https://connect.gettyimages.com/v1/partnerassetingestion/ConfirmAssetChanges"
    jsonData = {
        'RequestHeader':{'Token':token},
        'ConfirmAssetChangesRequestBody': {
            'TransactionId': transactionId
        }
    }
    
    
    result = postJson(endpoint,jsonData)
    print result
    if result['ResponseHeader']['Status'] == 'error':
        oauth()
        return postJson(endpoint, jsonData)
    else:
        return result



def removeImages(db, bucket, gettyIds):
    ids = []
    itemsToClear = ['Artist First N','Artist Last N','Copyright','Source','Source Page Link','Title','Type','getty_caption']
    
    setObj = {}
    for item in itemsToClear:
       setObj[item] = ' '
    
    
    #image assects
    setObj['artkick_url'] = 'http://cdn1.share.slickpic.com/u/Sheldonlaube/Album201401150855/org/Image_Currently_Unavailable/web.jpg'
    setObj['url'] = 'http://cdn1.share.slickpic.com/u/Sheldonlaube/Album201401150855/org/Image_Currently_Unavailable/web.jpg'
    setObj['icon'] = 'http://cdn1.share.slickpic.com/u/Sheldonlaube/Album201401150855/org/Image_Currently_Unavailable/web.jpg'
    setObj['thumbnail'] = 'http://cdn1.share.slickpic.com/u/Sheldonlaube/Album201401150855/org/Image_Currently_Unavailable/web.jpg'
    setObj['waterMark'] = 'http://cdn1.share.slickpic.com/u/Sheldonlaube/Album201401150855/org/Image_Currently_Unavailable/web.jpg'
    
    #tag it
    setObj['gettyRemoved'] = True
    for gettyId in gettyIds:
      ids.append("getty"+str(gettyId))

    #batch update
    db.gettyImages.update({'id':{'$in':ids}},{'$set':setObj}, multi=True)

    #clear files on Amazon S3
    for id in gettyIds:
       oldKey = bucket.get_key('getty/getty'+str(id)+'.jpg')
       print oldKey
       if oldKey != None:
          bucket.delete_key(oldKey)



def oneCycle(db, bucket, channelId):
    result = getAssetChanges(channelId)
    if result['ResponseHeader']['Status'] == 'error':
       return

    gettyIds = []
    #find all the images that need to be deleted
    for asset in result['GetAssetChangesResponseBody']['ChangedAssets']:
        if asset['AssetLifecycle'] == 'Delete':
            gettyIds.append(asset['AssetId'])

    print "images to be removed",gettyIds
    removeImages(db, bucket, gettyIds)

    #confirm trasaction
    confirmChanges(result['GetAssetChangesResponseBody']['TransactionId'])



def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    
    
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)
    
    
    
    oauth()
    
    while True:
       oneCycle(db, bucket, 180)
       time.sleep(30)
    


#conn.close()
if __name__ == "__main__":
    main()
