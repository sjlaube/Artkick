
from pymongo import Connection
import pymongo


#server = 'ds031948.mongolab.com'
#port = 31948
#db_name = 'zwamy'
#username = 'leonzwamy'
#password = 'zw12artistic'

server = 'ds047478.mongolab.com'
port = 47478
db_name = 'heroku_app16778260'
username = 'luckyleon'
password = 'artkick123rocks'

def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    topicItems = ["Title","Genre","Artist First N","Artist Last N",
                  "Cat1Viewlist","Cat2Viewlist","Cat3Viewlist"]
    for imageObj in db.images.find():
        #if 'topics' in imageObj:
        #    continue
        
        imageObj['topics'] = []
        for item in topicItems:
            if item in imageObj:
                imageObj['topics'].append(imageObj[item].strip().lower())
        
        #merge name
        if "Artist First N" in imageObj and "Artist Last N" in imageObj:
            imageObj['Full Artist Name'] = imageObj["Artist First N"].strip().lower()+' '+imageObj["Artist Last N"].strip().lower()
            imageObj['topics'].append(imageObj['Full Artist Name'])
                
        db.images.update({'id':imageObj['id']},{'$set':{'topics':imageObj['topics']}})
        print imageObj['id'],'done!'

    conn.close()
    
    




if __name__ == "__main__":
    main()
