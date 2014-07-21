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
expire = 3600*1000*24*7  #7 days



client_key = 'tpkeup4jxgrgydhquxeabuad'
client_secret = 'yamGJCFjYqjf2cF2pBHSYGJP2TxcVWfraQN3UjsGEEcnz'
getty_user = 'artkick_api'
getty_pswd = 't4YWhg9JPBf4Fkw'




#S3 storage
myKey = "AKIAIA2YFFGUFIQLTX2A"
mySecretKey = "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"
myBucket = 'artkickbucket1'



def utcMilli():
    return int(round(time.time() * 1000))



def removeImage(db, bucket,id):
    oldKey = bucket.get_key('getty/getty'+str(id)+'.jpg')
    print oldKey
    if oldKey != None:
       bucket.delete_key(oldKey)

    db.gettyImages.update({'id':'getty'+str(id)},{'$set':{'has_highres':False, 'processing':False}})


def getBucket():
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)
    return bucket



def oneCycle(db, bucket):
# peek the newly accessed images
# we don't clear images in this worker
# find the images that have been recently accessed(sorted by the time stamp, reverse order)

# peek 100 images first
    print 'starting a cycle'
    imagesToClearSet = db.gettyImages.find({'has_highres':True, 'last_visit':{'$lt':utcMilli() - expire}}).limit(100).sort('last_visit', pymongo.ASCENDING)
    for image in imagesToClearSet:
       # here we don't care if the image is still referenced, remove it anyway
        removeImage(db, bucket,image['id'][5:])





def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    
    
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)

    while True:
       oneCycle(db,bucket)
       time.sleep(3)

    

#conn.close()
if __name__ == "__main__":
    main()