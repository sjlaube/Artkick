# coding: utf-8
from pymongo import Connection
import pymongo
import string


#new prod db
server = 'ds047539-a0.mongolab.com'
port = 47539
db_name = 'heroku_app24219881'
username = 'artCoder'
password = 'zwamygogo'

#single node2
#server = 'ds053468-a0.mongolab.com'
#port = 53468
#db_name = 'heroku_app16778260'
#username = 'artCoder'
#password = 'zwamygogo'


def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    listNames = ['Gaspard Nunez Delgado','Frans Hals','Sebastia Junyent','Animals','Flowers']
    
    
    for catObj in db.categories.find({'name':{'$in':['Paintings', 'Historical', 'Photography']}},timeout=False):
        print catObj['name']
        index = 0
        if 'featuredLists' not in catObj:
            continue
        

        
        
        for listId in catObj['featuredLists']:
            listSet = db.viewlists.find({'id':listId})
            if listSet.count() > 0:
                listObj = listSet[0]
                    #if len(listObj['images']) > 0 and not 'coverImage' in listObj:
                    #if len(listObj['images']) > 0 and not 'coverImage' in listObj:
                    #if not 'coverImage' in listObj:
                    #if listObj['name'] in listNames and not 'coverImage' in listObj:
                    #if not 'coverImage' in listObj:
                    #if not 'coverImage' in listObj:
                    #if not 'coverImage' in listObj:
                    #if listObj['id'] == 2031:
                    #if listId==77303 or listId==77300:
                if not ('coverImage' in listObj and listObj['coverImage']!= None):
                    print listObj['name'], listObj['id']
                    coverId = listObj['images'][0]
                    if 'allListMark' in listObj:
                        coverId = listObj['images'][1]
                    imageSet = db.images.find({'id':coverId})
                    if imageSet.count() > 0:
                        imageObj = imageSet[0]
                        coverLink = imageObj['thumbnail']
                        db.viewlists.update({'id':listId},{'$set':{'coverImage':coverLink}})

                        print index, catObj['featuredLists2'][index]
                        catObj['featuredLists2'][index]['coverImage'] = coverLink
                        db.categories.update({'name':catObj['name']},{'$set':
                                                 {'featuredLists2':catObj['featuredLists2']}})
                        print listObj['name'], coverLink
            
            index += 1        
          
          #db.categories.update({'name':catObj['name']},{'$set':
          #{'featuredLists2':catObj['featuredLists2']}})
                        
    

    conn.close()
    
    




if __name__ == "__main__":
    main()
