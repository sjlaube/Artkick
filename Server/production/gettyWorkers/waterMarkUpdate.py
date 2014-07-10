from pymongo import Connection
import pymongo
import string
import httplib, urllib, urllib2
import re, urlparse
import time
import json



server = 'ds063698-a0.mongolab.com'
port = 63698
db_name = 'heroku_app18544527'
username = 'artCoder'
password = 'zwamygogo'


client_key = 'tpkeup4jxgrgydhquxeabuad'
client_secret = 'yamGJCFjYqjf2cF2pBHSYGJP2TxcVWfraQN3UjsGEEcnz'
getty_user = 'artkick_api'
getty_pswd = 't4YWhg9JPBf4Fkw'



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



def postJson(url, jsonData):
   jsonStr = json.dumps(jsonData)
   req = urllib2.Request(url, jsonStr, headers={'Content-Type':'application/json','Accept':'application/json'})
   res = urllib2.urlopen(req)
   result = json.loads(res.read())
   return result


def getWaterMark(db,ids):
    details = getImageDetails(ids)['GetImageDetailsResult']['Images']

    for detail in details:
        print 'UrlWatermarkComp',detail['UrlWatermarkComp']
        db.gettyImages.update({'id':'getty'+detail['ImageId']},{'$set':{'waterMark':detail['UrlWatermarkComp']}})


def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    

    oauth()
    

    cart = []
    for image in db.gettyImages.find({'waterMark':{'$exists':False}}, timeout = False):
      print image['id']

      cart.append(image['id'][5:])
      if len(cart) == 5:
        getWaterMark(db,cart)
        cart = []
     
    print cart
    getWaterMark(db,cart)

    
    

    conn.close()

if __name__ == "__main__":
    main()