from pymongo import Connection
import pymongo
import string
import urllib
import re


baseUrl = "http://fierce-basin-2977.herokuapp.com/stag/RemoveImagesFromViewlist?"
#baseUrl = "http://fierce-basin-2977.herokuapp.com/prod/RemoveImagesFromViewlist?"

if True:
    server = 'ds053468-a0.mongolab.com'
    port = 53468
    db_name = 'heroku_app16778260'
    username = 'artCoder'
    password = 'zwamygogo'
else:
    server = 'ds047539-a0.mongolab.com'
    port = 47539
    db_name = 'heroku_app24219881'
    username = 'artCoder'
    password = 'zwamygogo'



u_server = 'ds063698-a0.mongolab.com'
u_port = 63698
u_db_name = 'heroku_app18544527'
u_username = 'artCoder'
u_password = 'zwamygogo'
u_conn = Connection(u_server, u_port)
u_db = u_conn[u_db_name]
u_db.authenticate(u_username, u_password)
email='leon@artkick.com'
user = u_db.users.find({'email':email})[0]
token = user['edit_tokens'][0]
print email, token
u_conn.close()


def removeAChunk(list, imageQuery):
    try:
       print imageQuery
       url = baseUrl+'email='+email+'&token='+token+'&listId='+str(list)+imageQuery
       print url
       result = urllib.urlopen(url)
       print list, result.read()
    
    except:
       print 'server error!'



def removeImagesFromList(list,images):
    print list, images
    chunkSize = 10
    imageQuery = ''
    count = 0
    for imgId in images:
       imageQuery += '&images[]='+str(imgId)
       count += 1
       if count == chunkSize:
          print imageQuery
          #make the request
          removeAChunk(list,imageQuery)
          imageQuery = ''
          count = 0
    if count < chunkSize and count > 0:
       print imageQuery
       #make the request
       removeAChunk(list,imageQuery)



def bulkClean(db, images):
    print 'imageObjects cleaning...', images
    db.images.update({'id':{'$in':images}},{'$set':{'removed':True, 'topics':[]}},multi=True)

def clearTrashList(listName,db):
    print listName
    
    imgIds = []
    
    for listObj in db.viewlists.find({'name':listName}, timeout=False):
       print listObj['id']
       if 'images' in listObj:
         for imgId in listObj['images']:
             if imgId not in imgIds:
                imgIds.append(imgId)

    print 'images to remove:', imgIds


    listMap = {}
    for imgId in imgIds:
        imageSet = db.images.find({'id':imgId})
        if imageSet.count() > 0:
          imageObj = imageSet[0]
          if 'viewlists' in imageObj:
              for rListId in imageObj['viewlists']:
                  if rListId in listMap:
                    listMap[rListId].append(imgId)
                  else:
                    listMap[rListId] = [imgId]

    print listMap
    for listId in listMap:
        removeImagesFromList(listId, listMap[listId])


    #bulk clear image objects
    cartSize = 400
    cart = []
    for imgId in imgIds:
      cart.append(imgId)
      if len(cart) == cartSize:
         bulkClean(db, cart)
         cart = []
    if len(cart) > 0 and len(cart) < cartSize:
        bulkClean(db, cart)



    #handle allLists
    for allList in db.viewlists.find({'allListMark':True}):
        print 'allList',allList['id']
        removeImagesFromList(allList['id'],imgIds)











def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    
    #find the trash lists
    #"AAASeparated" "AAAAtrash" "AAAAseparated"
    trashes = ['AAAtest']
    for trashList in trashes:
        clearTrashList(trashList,db)
    conn.close()

if __name__ == "__main__":
    main()