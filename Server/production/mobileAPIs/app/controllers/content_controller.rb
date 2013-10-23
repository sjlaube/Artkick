class ContentController < ApplicationController
  require 'rubygems'
  require 'mongo'
  require 'json'
  include Mongo
  
  #@@server = 'ds031948.mongolab.com'
  #@@port = 31948
  #@@db_name = 'zwamy'
  #@@username = 'leonzwamy'
  #@@password = 'zw12artistic'
  
  @@server = 'ds047478.mongolab.com'
  @@port = 47478
  @@db_name = 'heroku_app16778260'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'
  
  def index
    
  end
  
  def createCategory
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
    
    
    if(params[:userEmail]==nil)
      result = {"status"=>"failure", "message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:userEmail].length==0)
      result = {"status"=>"failure", "message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    #if category exists
    if @db["categories"].find({"name"=>params[:catName]}).count > 0
      result = {"status"=>"failure", "message"=>"error, category exists!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    #if user doesn't exist
    userSet = @db["users"].find({"email"=>params[:userEmail].strip.downcase})
    if userSet.count == 0
      result = {"status"=>"failure", "message"=>"user doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    user = userSet.to_a[0]
    category = {"name"=>params[:catName], "user_name"=> user["name"], "user_email"=>user["email"],
      "date"=>Time.now.to_s, "tags"=>[], "viewlists"=>[]}
    @db["categories"].insert(category)
    
    result = {"status"=>"success", "message"=>"Category "+params[:catName]+" is created by "+user["name"]+" at "+category["date"]+"!"}
    render :json=>result, :callback => params[:callback]  
  end
  
  
  def deleteCategory 
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
    
    if @db["categories"].find({"name"=>params[:catName]}).count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    @db["categories"].remove({"name"=>params[:catName]})
    result = {"status"=>"success", "message"=>"Category "+params[:catName]+" is removed!"}
    render :json=>result, :callback => params[:callback]   
  end
  
  def allCategories
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {"categories"=>@db["categories"].find().sort({"name"=>1}).to_a}
    render :json=>result, :callback => params[:callback]  
    
  end
  
  
  def addListsToCategory
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
    
    if(params[:lists]==nil)
      result = {"status"=>"failure", "message"=>"error, no viewlists!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:lists].length==0)
      result = {"status"=>"failure", "message"=>"error, no viewlists!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    catSet = @db["categories"].find({"name"=>params[:catName]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    processedLists = []
    params[:lists].each do |list|
      if not category["viewlists"].include? list.to_i
        category["viewlists"].push(list.to_i)
        processedLists.push(list.to_i)
      end     
    end
    @db["categories"].update({"name"=>params[:catName]},{"$set"=>{"viewlists"=>category["viewlists"]}})
    result = {"status"=>"success", "message"=> "Viewlists "+processedLists.join(', ') +' are added to Category '+params[:catName]}
    render :json=>result, :callback => params[:callback]
    return
    
  end
  
  
  def clearListsFromCategory
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
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    
    @db["categories"].update({"name"=>params[:catName]},{"$set"=>{"viewlists"=>[]}})
    result = {"status"=>"success", "message"=>"Category "+params[:catName]+" is clear!"}
    render :json=>result, :callback => params[:callback] 

      
  end
  
  def removeListsFromCategory
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
    
    
    if(params[:lists]==nil)
      result = {"status"=>"failure", "message"=>"error, no viewlists!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:lists].length==0)
      result = {"status"=>"failure", "message"=>"error, no viewlists!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    catSet = @db["categories"].find({"name"=>params[:catName]})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    processedLists = []
    params[:lists].each do |list|
      if category["viewlists"].include? list.to_i
        category["viewlists"].delete(list.to_i)
        processedLists.push(list.to_i)
      end     
    end
    
    @db["categories"].update({"name"=>params[:catName]},{"$set"=>{"viewlists"=>category["viewlists"]}})
    result = {"status"=>"success", "message"=>"Lists "+processedLists.join(", ")+" are removed from Category "+params[:catName]+"!"}
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
    render :json=>result, :callback => params[:callback]  
       
 end  
  
  
 def allViewlists
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @viewlists = @db["viewlists"].find({}).to_a
    render :json=>@viewlists, :callback => params[:callback]
 end
 
  
  
  
  
  
  
      
  def allImages
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @images = @db["images"].find({}).to_a
    render json:@images  
  end
  

 def getImage
    if(params[:id]==nil)
      result = {"result"=>"error, no image ID!"}
      render json: result
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no image ID!"}
      render json: result
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    imageSet = @db['images'].find({"id"=>params[:id].to_i})
    if imageSet.count==0
      result = {"result"=>"error, no image found!"}
      render json: result
    end
    render json: imageSet.to_a[0]
   
 end
 

  
  def getViewlist
    if(params[:id]==nil)
      result = {"result"=>"error, no id!"}
      render json: result
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no id!"}
      render json: result
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
      render json:result
    end
    
    viewlist = viewlistSet.to_a[0] 
    viewlist["imageSet"]=[]
    viewlist["images"].each do|image|
      imageSet = @db["images"].find({"id"=>image.to_i})
      if imageSet.count > 0
        viewlist["imageSet"].append(imageSet.to_a[0])
      end
    end
    render json:viewlist
  end
  
  def getPlayer
    if(params[:snumber]==nil)
      result = {"result"=>"error, no serial number!"}
      render json: result
      return
    end
    
    if(params[:snumber].length==0)
      result = {"result"=>"error, no serial number!"}
      render json: result
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    playerSet = @db["clients"].find({"account"=>params[:snumber]})
    if playerSet.count == 0
      result = {"result"=>"unkown player"}
      render json:result
    end
    render json:playerSet.to_a[0] 
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
  
  
end  
