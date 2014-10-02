from pymongo import Connection
import pymongo
import string

from apiclient.discovery import build
import oauth2client.client
import httplib2
import pprint
import json
import time


u_server = 'ds063698-a0.mongolab.com'
u_port = 63698
u_db_name = 'heroku_app18544527'
u_username = 'artCoder'
u_password = 'zwamygogo'
package_name = 'com.artkick.artkick'


def utcMilli():
    return int(round(time.time() * 1000))

def checkSubs(service, productId, purchaseToken):
    try:
      request = service.purchases().subscriptions().get(packageName=package_name, subscriptionId=productId, token=purchaseToken)
      result = request.execute()
      return result
    except:
      return None


def oneCycle(service, u_db, productName):
    print 'processsing... '+productName
    timeName = 'android_'+productName+'_expire'
    buffer = 8*3600*1000  #8 hours before expire
    expiredDur = 7*24*3600*1000 # one week
    
    currTime = utcMilli()
    for user in u_db.users.find({timeName:{'$lt':(currTime+buffer), '$gt':(currTime-expiredDur)}},timeout=False):

        
        print 'processing... '+user['email']
        if 'android_purchaseData' in user and productName in user['android_purchaseData']:
            purchaseData = user['android_purchaseData'][productName]
            print purchaseData
            obj = json.loads(purchaseData)
            if 'productId' in obj and 'purchaseToken' in obj:
                transData = checkSubs(service, obj['productId'], obj['purchaseToken'])
                if transData != None:
                    
                    transData['expiryTimeMillis'] = int(transData['expiryTimeMillis'])
                    transData['startTimeMillis'] = int(transData['startTimeMillis'])
                    print transData
                    user['android_transactionData'][productName] = transData
                    
                    print user['android_transactionData']
                    u_db.users.update({'email':user['email']},{'$set':{'android_transactionData':user['android_transactionData'],
                                      timeName:transData['expiryTimeMillis']}})



def main():
    u_conn = Connection(u_server, u_port)
    u_db = u_conn[u_db_name]
    u_db.authenticate(u_username, u_password)
    

    
    
    service_account_email = '604576270939-u4s6odng8ehoi6pclvjnm90qasbb0fvf@developer.gserviceaccount.com'
    scopes = ('https://www.googleapis.com/auth/androidpublisher')
    f = file('Google Play Android Developer-38d6e22c065b.p12', 'rb')
    key = f.read()
    f.close()
    credentials = oauth2client.client.SignedJwtAssertionCredentials(
      service_account_email,
      key,
      scope = scopes
    )

    http = httplib2.Http()
    http = credentials.authorize(http)
    service = build('androidpublisher', 'v2', http=http)
    
    prodNames = ['getty_all2']
    while True:
      for prodName in prodNames:
         oneCycle(service, u_db, prodName)
      time.sleep(5)
    

    
    u_conn.close()




if __name__ == "__main__":
    main()
