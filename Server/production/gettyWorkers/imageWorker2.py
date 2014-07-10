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


client_key = 'tpkeup4jxgrgydhquxeabuad'
client_secret = 'yamGJCFjYqjf2cF2pBHSYGJP2TxcVWfraQN3UjsGEEcnz'
getty_user = 'artkick_api'
getty_pswd = 't4YWhg9JPBf4Fkw'

artkick_base = 'http://artkickbucket1.s3.amazonaws.com/'

token = ""

target_size = [1920,1080]

#S3 storage
myKey = "AKIAIA2YFFGUFIQLTX2A"
mySecretKey = "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"
myBucket = 'artkickbucket1'

imageCount = -1
imagesToPeek = Queue.Queue()
imageQueue = Queue.Queue()
urlQueue = Queue.Queue()

imageLimit = 1000
threads = []
threadLock = threading.Lock()

cart_size = 5
expire = 3600*1000*24*7  #7 days


class imageProcessWorker(threading.Thread):
    def __init__(self, threadID, name, db, bucket):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.db = db
        self.bucket = bucket
    
    def run(self):
        print "Starting "+self.name
        while True:
            global urlQueue
            if urlQueue.qsize() > 0:
                url = urlQueue.get()
                print self.threadID,'compressing image', url['ImageId']
                try:
                  compressImage(self.db, self.bucket, url['ImageId'], url['UrlAttachment'])
                except:
                  print 'S3 error...'
            else:
                print 'image worker '+self.name+' is waiting...'
                time.sleep(1)


class urlWorker(threading.Thread):
    def __init__(self, threadID, name, db, bucket):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.db = db
        self.bucket = bucket
    
    def run(self):
        print "Starting "+self.name
        while True:
            cart = []
            global imageQueue
            global urlQueue
            #print 'cart_size',cart_size
            print 'imageQueue', imageQueue.qsize()
            while len(cart) < cart_size and imageQueue.qsize() > 0:
                print 'add image to cart', len(cart)
                cart.append(imageQueue.get())
            
            print len(cart)
            if len(cart) > 0:
                try:
                    print 'getting urls from getty...'
                    urls = getImageUrls(cart)
                    gotIds = []
                    for url in urls:
                        urlQueue.put(url)
                        gotIds.append(url['ImageId'])
                        print 'pushing url',url
            
                    for id in cart:
                        if not id in gotIds:
                            self.db.gettyImages.update({'id':'getty'+str(id)},{'$set':{'processing':False}})
            
                except:
                   print "getty api error..., ignore it"
                   for id in cart:
                       self.db.gettyImages.update({'id':'getty'+str(id)},{'$set':{'processing':False}})
        
            time.sleep(3)



class imageCheckWorker(threading.Thread):
    def __init__(self, threadID, name, db, bucket):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.db = db
        self.bucket = bucket
    
    def run(self):
        print "Starting "+self.name
        while True:
            oneCycle(self.db, self.bucket)
            time.sleep(2)


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




def getImageDetails(ids):
   endpoint = "https://connect.gettyimages.com/v1/search/GetImageDetails"
   jsonData = {
       'RequestHeader':{'Token':token},
       'GetImageDetailsRequestBody':{
          'ImageIds':ids,
          'CountryCode':"USA",
          'language':"en-us"
       }
   }
   
   result = postJson(endpoint,jsonData)
   #print result
   if result['ResponseHeader']['Status'] == 'error':
       oauth()
       return postJson(endpoint, jsonData)
   else:
      return result



def getDownloadAuth(images):
   endpoint = "https://connect.gettyimages.com/v1/download/GetImageDownloadAuthorizations"
   jsonData = {
        'RequestHeader':{'Token':token},
        'GetImageDownloadAuthorizationsRequestBody':{
           'ImageSizes':[]
        }
   }
   
   for image in images:
       jsonData['GetImageDownloadAuthorizationsRequestBody']['ImageSizes'].append({'ImageId':image['id'], 'SizeKey':image['SizeKey']})

   result = postJson(endpoint,jsonData)
   print result
   if result['ResponseHeader']['Status'] == 'error':
      oauth()
      return postJson(endpoint, jsonData)
   else:
      return result


def getDownloadUrl(items):
    endpoint = 'https://connect.gettyimages.com/v1/download/CreateDownloadRequest'
    jsonData = {
         'RequestHeader':{'Token':token},
            'CreateDownloadRequestBody':{
                'DownloadItems':[]
        }
    }
        
    
    for item in items:
       jsonData['CreateDownloadRequestBody']['DownloadItems'].append({'DownloadToken':item['DownloadToken']})

    result = postJson(endpoint,jsonData)
    if result['ResponseHeader']['Status'] == 'error':
       oauth()
       return postJson(endpoint, jsonData)
    else:
       return result




def postJson(url, jsonData):
   jsonStr = json.dumps(jsonData)
   req = urllib2.Request(url, jsonStr, headers={'Content-Type':'application/json','Accept':'application/json'})
   res = urllib2.urlopen(req)
   result = json.loads(res.read())
   return result


def getImageUrls(ids):
    details = getImageDetails(ids)['GetImageDetailsResult']['Images']
    if len(details) == 0:
       return []
    
    toAuths = []
    for detail in details:
        print 'downloadable images',detail['SizesDownloadableImages']
        index = len(detail['SizesDownloadableImages']) - 1
        
        if index < 0:
            continue
        toAuth = detail['SizesDownloadableImages'][index]
        toAuth['id'] = detail['ImageId']
        toAuths.append(toAuth)

    if len(toAuths) == 0:
       return []

    auths = getDownloadAuth(toAuths)['GetImageDownloadAuthorizationsResult']['Images']
     
    if len(auths) == 0:
       return []

    toDownloads = []
    for auth in auths:
       toDownload = {'DownloadToken':auth['Authorizations'][0]['DownloadToken']}
       toDownloads.append(toDownload)
        
        
    urls = getDownloadUrl(toDownloads)['CreateDownloadRequestResult']['DownloadUrls']
    print 'urls',urls

    return urls


def compressImage(db, bucket, id, url):
    url = iriToUri(url)
    text = urllib.urlopen(url = url).read()
    if text[0]=='5':
        print "image url error!"
        return False
    imData = cStringIO.StringIO(text)
    try:
       img = Image.open(imData)
    except:
       writer.writerow([url])
       print "error "+url
       return False

    img.thumbnail(target_size,Image.ANTIALIAS)
    image_name = 'getty/getty'+str(id)+'.jpg'

    #check if key exists
    oldKey = bucket.get_key(image_name)
    print oldKey
    if oldKey != None:
        print 'Key exists'
        return True

    key = bucket.new_key(image_name)

    output = cStringIO.StringIO()
    img.save(output,"JPEG",quality=95)
    key.set_contents_from_string(output.getvalue(),headers={'Content-Type': 'image/jpeg'})
    bucket.set_acl("public-read",image_name)

    db.gettyImages.update({'id':'getty'+id},{'$set':{'artkick_url':artkick_base+image_name, 'artkick_timestamp':utcMilli(), 'has_highres':True, 'processing':False}})
    #threadLock.acquire()
    #global imageCount
    #imageCount += 1
    #threadLock.release()

    return True



def removeImage(db, bucket,id):
    oldKey = bucket.get_key('getty/getty'+str(id)+'.jpg')
    print oldKey
    if oldKey != None:
       bucket.delete_key(oldKey)

    db.gettyImages.update({'id':'getty'+str(id)},{'$set':{'has_highres':False}})


def getBucket():
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)
    return bucket



def oneCycle(db, bucket):
# peek the newly accessed images
# we don't clear images in this worker
# find the images that have been recently accessed(sorted by the time stamp, reverse order)

# peek 100 images first

    #for now, clear the gettyToCheck array
    db.gettyToCheck.update({},{'$set':{'images':[]}})
    global imageQueue
    print 'expire', expire
    imagesToDevSet = db.gettyImages.find({'has_highres':False, 'refNum':{'$gt':0}, 'processing':False, 'last_visit':{'$gte':utcMilli()-expire}}).limit(100).sort('last_visit', pymongo.DESCENDING)
    print 'got ',imagesToDevSet.count(),'images'
    for image in imagesToDevSet:
        db.gettyImages.update({'id':image['id']},{'$set':{'processing':True}})
        imageQueue.put(image['id'][5:])



def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    
    
    connS3 = S3Connection(myKey, mySecretKey)
    bucket = connS3.get_bucket(myBucket)
    
    
    
    oauth()
    
    #reset processing flag for all images
    db.gettyImages.update({},{'$set':{'processing':False}}, multi=True)
   
   
    
    #image chekcer thread
    imageCheckThread = imageCheckWorker(10,"Image Checker", db, bucket)
    imageCheckThread.start()
    threads.append(imageCheckThread)
    
    
    
    #url worker thread
    urlThread = urlWorker(11,"Url Worker", db, bucket)
    urlThread.start()
    threads.append(urlThread)
    
    for i in range(5):
       thread = imageProcessWorker(i,"Thread"+str(i),db, bucket)
       thread.start()
       threads.append(thread)
    
    for thread in threads:
       thread.join()


    
    
    

#conn.close()
if __name__ == "__main__":
    main()