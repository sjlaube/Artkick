class Content1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  require 'json'
  include Mongo
  
  #@@server = 'ds031948.mongolab.com'
  #@@port = 31948
  #@@db_name = 'zwamy'
  #@@username = 'leonzwamy'
  #@@password = 'zw12artistic'
  
  #@@server = 'ds047478.mongolab.com'
  #@@port = 47478
  #@@db_name = 'heroku_app16778260'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'

  @@server = 'ds051518-a0.mongolab.com'
  @@port = 51518
  @@db_name = 'heroku_app16777800'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'

  def allCategories
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {"categories"=>@db["categories"].find().sort({"name"=>1}).to_a}
    @client.close
    render :json=>result, :callback => params[:callback]  
  end
  
  
  def allCategories2
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    if params[:featured]!=nil
      catObjs = @db["categories"].find({},{:fields=>['name','featuredListNum']}).sort({"name"=>1}).to_a
      catObjs.each do |catObj|
        catObj['viewlistNum'] = catObj['featuredListNum']
        catObj.delete('featuredListNum')
      end
      result = {"categories"=>catObjs}
      @client.close
      render :json=>result, :callback => params[:callback]  
      return
    end
    
    result = {"categories"=>@db["categories"].find({},{:fields=>['name','viewlistNum']}).sort({"name"=>1}).to_a}
    @client.close
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
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    field = 'viewlists2'
    if params[:featured]!=nil
      field = 'featuredLists2'
    end
    
    catSet = @db["categories"].find({"name"=>params[:catName]},{:fields=>[field]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
      @client.close
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
    @client.close
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
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    catSet = @db["categories"].find({"name"=>params[:catName]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    viewlists = []
    category["viewlists"].each do |listId|
      listSet = @db["viewlists"].find({"id"=>listId})
      if listSet.count > 0
        viewlists.push(listSet.to_a[0])
      end
    end
    quickSort(viewlists,0,viewlists.length-1)
    result = {"status"=>"success", "viewlists"=>viewlists}
    @client.close
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
    
    items2 = objs[endIndex]["name"].split()
    name2 = items2[items2.length-1]
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
