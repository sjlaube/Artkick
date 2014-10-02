class Content1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  require 'json'
  include Mongo
  
  @@userDbId = '63'
  @@contentDbId = '47'
  @@privateRange = 10000000000
  @@dbMeta = {}


  @@dbMeta['63'] = {:server => 'ds063698-a0.mongolab.com', :port => 63698, :db_name => 'heroku_app18544527', 
    :username => 'artCoder', :password => 'zwamygogo'}  

  
  @@dbMeta['31'] = {:server => 'ds031948.mongolab.com', :port => 31948, :db_name => 'zwamy', :username => 'leonzwamy', 
    :password => 'zw12artistic'}
  
  @@dbMeta['47'] = {:server => 'ds047539-a0.mongolab.com', :port => 47539, :db_name => 'heroku_app24219881',
    :username => 'artCoder', :password => 'zwamygogo' }
  
  @@dbMeta['53'] = {:server => 'ds053468-a0.mongolab.com', :port => 53468, :db_name => 'heroku_app16778260', 
    :username => 'artCoder', :password => 'zwamygogo'}


    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])
    

  def utcMillis
    return (Time.new.to_f*1000).to_i
  end
    
  def getListSet(listId)
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
    
     if (not listId.is_a? Numeric) and (listId.include? 'top')
        return @@userDb['privLists'].find({'id'=>listId})
     end
     
     if listId.to_i >= @@privateRange
        return @@userDb['privLists'].find({'id'=>listId.to_i})
     end
     
     return @@contentDb['viewlists'].find({'id'=>listId.to_i})   
  end
  
  
  def getImageSet(imageId)
    
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
     if imageId.to_i >= @@privateRange
        return @@userDb['privImages'].find({'id'=>imageId.to_i})
     end
     
     return @@contentDb['images'].find({'id'=>imageId.to_i})        
         
  end
  
  def getIndex(name)
      names = ['image','privImage','viewlist','privList','user']
      if not names.include? name
        return -1
      end
      
      baseUrl = 'http://pacific-oasis-9960.herokuapp.com/id/'
      url = baseUrl + name
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      request = Net::HTTP::Get.new(uri.request_uri)
      res = http.request(request)
      dic = JSON.parse(res.body)
      if dic['Status'] != 'success'
        return -1
      end
      
      return dic['id'].to_i
  end   
  
  def connectDb
    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])
    
  end
  
  
  def closeDb
    if @@userClient != nil
      @@userClient.close
    end
    
    if @@contentClient != nil
      @@contentClient.close
    end
  end

  def allCategories

    result = {"categories"=>@@contentDb["categories"].find().sort({"name"=>1}).to_a}

    render :json=>result, :callback => params[:callback]  
  end
  
  
  def allCategories2

    if params[:featured]!=nil
      catObjs = @@contentDb["categories"].find({},{:fields=>['name','featuredListNum']}).sort({"name"=>1}).to_a
      catObjs.each do |catObj|
        catObj['viewlistNum'] = catObj['featuredListNum']
        catObj.delete('featuredListNum')
      end
      result = {"categories"=>catObjs}

      render :json=>result, :callback => params[:callback]  
      return
    end
    
    result = {"categories"=>@@contentDb["categories"].find({},{:fields=>['name','viewlistNum']}).sort({"name"=>1}).to_a}

    render :json=>result, :callback => params[:callback]  
  end
    
  
  def getViewlistsByCategory2
    if(params[:catName]==nil)
      result = {"status"=>"failure", "message"=>"error, no category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:catName].length==0)
      result = {"status"=>"failure", "message"=>"error, no category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
   
    if params[:catName]=='Spotlight'
      listSet = @@contentDb['viewlists'].find({'spotlight'=>true},{:fields=>['id','name','coverImage','images']})
      viewlists = [];
      listSet.to_a.each do |listObj|
        miniList = {}
        miniList['id'] = listObj['id']
        miniList['name'] = listObj['name']
        miniList['coverImage']  = listObj['coverImage']
        miniList['imageNum'] = listObj['images'].length
        
        viewlists.push(miniList)
      end
       
      result = {"status"=>"success", "viewlists"=>viewlists}
      render :json=>result, :callback => params[:callback]        
      return
     
    end

    
    field = 'viewlists2'
    if params[:featured]!=nil
      field = 'featuredLists2'
    end
    
    catSet = @@contentDb["categories"].find({"name"=>params[:catName]},{:fields=>[field]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    viewlists = category[field]
    if params[:catName] == 'Artists'
       lastNameQuickSort(viewlists,0,viewlists.length-1)      
    else
       quickSort(viewlists,0,viewlists.length-1)    
    end
    result = {"status"=>"success", "viewlists"=>viewlists}

    render :json=>result, :callback => params[:callback]  
 end
 
 
 def getViewlistsByCategory
    if(params[:catName]==nil)
      result = {"status"=>"failure", "message"=>"error, no category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:catName].length==0)
      result = {"status"=>"failure", "message"=>"error, no category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
   

    
    
    catSet = @@contentDb["categories"].find({"name"=>params[:catName]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    viewlists = []
    category["viewlists"].each do |listId|
      listSet = @@contentDb["viewlists"].find({"id"=>listId})
      if listSet.count > 0
        viewlists.push(listSet.to_a[0])
      end
    end
    quickSort(viewlists,0,viewlists.length-1)
    result = {"status"=>"success", "viewlists"=>viewlists}

    render :json=>result, :callback => params[:callback]  
       
 end  
  
def quickSort(objs,startIndex,endIndex)
  if startIndex >= endIndex
    return
  end
  
  piv = rand(startIndex..endIndex)
  
  temp = objs[endIndex]
  objs[endIndex]=objs[piv]
  objs[piv] = temp
  
  fb = startIndex
  
  for i in (startIndex..endIndex-1)
    if objs[i]["name"] < objs[endIndex]["name"]
      temp = objs[fb]
      objs[fb]=objs[i]
      objs[i]=temp
      fb = fb+1
    end
  end
  
  temp = objs[fb]
  objs[fb] = objs[endIndex]
  objs[endIndex] = temp
  #print objs
  quickSort(objs,startIndex,fb)
  quickSort(objs,fb+1,endIndex)
end  


def lastNameQuickSort(objs,startIndex,endIndex)
  if startIndex >= endIndex
    return
  end
  
  piv = rand(startIndex..endIndex)
  
  temp = objs[endIndex]
  objs[endIndex]=objs[piv]
  objs[piv] = temp
  
  fb = startIndex
  
  for i in (startIndex..endIndex-1)
    items1 = objs[i]["name"].split()
    name1 = items1[items1.length-1]
    
    
    if objs[i]["name"].include? "Brueghel"
       name1 = "Brueghel"
    end
    
    if items1[0]=='All'
      name1 = " All"
    end
    
    items2 = objs[endIndex]["name"].split()
    name2 = items2[items2.length-1]
    if objs[endIndex]["name"].include? "Brueghel"
       name2 = "Brueghel"
    end
    
    if items2[0]=='All'
      name2 = " All"
    end
    
    
    
    if name1 < name2
      temp = objs[fb]
      objs[fb]=objs[i]
      objs[i]=temp
      fb = fb+1
    end
  end
  
  temp = objs[fb]
  objs[fb] = objs[endIndex]
  objs[endIndex] = temp
  #print objs
  lastNameQuickSort(objs,startIndex,fb)
  lastNameQuickSort(objs,fb+1,endIndex)
end  
  
end  
