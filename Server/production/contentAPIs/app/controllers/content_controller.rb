class ContentController < ApplicationController
  require 'rubygems'
  require 'mongo'
  require 'json'
  include Mongo
  require 'curb'
  
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
  
  def feedback
    if params[:email] == nil or params[:email].strip.length == 0
      result = {"status"=>"failure", "message"=>"user email is missing!"}
      render :json=>result, :callback => params[:callback]
      return
    end

    if params[:text] == nil or params[:text].strip.length == 0
      result = {"status"=>"failure", "message"=>"text is missing!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"status"=>"failure", "message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    userObj = userSet.to_a[0]
    subject = 'inquiry from application'
    if params[:subject]!=nil
      subject = params[:subject]
    end
    
    username = "sheldon@artkick.com" 
    password = "Sunnie" 
    url = 'https://artkick.zendesk.com/api/v2/tickets.json'
    ticket = {"ticket"=>{"requester"=>{"name"=>userObj['name'],"email"=>params[:email].strip.downcase}, "submitter_id"=>472474703, "subject"=>subject, "comment"=>{ "body"=>params[:text]}}}
    json_string = ticket.to_json()
    c = Curl::Easy.http_post(url, json_string) do |curl|
      curl.headers['Content-Type'] = 'application/json'
      curl.headers['Accept'] = 'application/json'
      curl.username = username
      curl.password = password
    end
    
    result = {'result'=>c.body_str}
    render :json=>result, :callback => params[:callback]
  end
  
  
   def RemoveCategory
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)  
    
    if @db["categories"].find({"name"=>params[:name]}).count == 0
      result = {"Status"=>"failure", "Message"=>"Category doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
    end   
    
    @db['categories'].remove({"name"=>params[:name]})
    @db['viewlists'].update({},{"$pull"=>{"categories"=>params[:name]}},opts={:upsert=>false, :multi=>true})  
    result = {"Status"=>"success", "Message"=>"Category "+params[:name]+" is removed!"}
    render :json=>result, :callback => params[:callback]  
 end
 
 def CreateCategory
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
    
    if @db["categories"].find({"name"=>params[:name]}).count > 0
      result = {"Status"=>"failure", "Message"=>params[:name]+" has been taken, please try another name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    catObj = {'name'=>params[:name], 'viewlists'=>[]}
    @db["categories"].insert(catObj)
    result = {"Status"=>"success","Message"=>"Category "+params[:name]+" is created!"}
    render :json=>result, :callback => params[:callback]      
 end
 
 def CreateViewlist
    if params[:listName] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:catName] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
 
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
       
    if @db["categories"].find({"name"=>params[:catName]}).count == 0  
      result = {"Status"=>"failure","Message"=>"Cateogry doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    currIndex = @db['index'].find().to_a[0]['viewlist'].to_i+1
    
    listObj = {'name'=>params[:listName], 'categories'=>[params[:catName]], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[]}
      
    @db['viewlists'].insert(listObj)
    @db['categories'].update({'name'=>params[:catName]},{'$push'=>{'viewlists'=>currIndex}})
    @db['index'].update({},{'$set'=>{'viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}
    render :json=>result, :callback => params[:callback] 
 end
 
 
 def RemoveViewlistFromCategory

    if params[:listId] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:catName] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
 
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
   
    if @db["categories"].find({"name"=>params[:catName]}).count == 0  
      result = {"Status"=>"failure","Message"=>"Cateogry doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    if @db["viewlists"].find({"id"=>params[:listId].to_i}).count == 0  
      result = {"Status"=>"failure","Message"=>"Viewlist doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    @db['viewlists'].update({"id"=>params[:listId].to_i},{'$pull'=>{'categories'=>params[:catName]}})
    @db['categories'].update({"name"=>params[:catName]},{'$pull'=>{'viewlists'=>params[:listId].to_i}})
    
    trashLists = @db['trashes'].find({'type'=>'viewlists'}).to_a[0]['viewlists']
    if not trashLists.include?params[:listId].to_i
      @db['trashes'].update({'type'=>'viewlists'},{'$push'=>{'viewlists'=>params[:listId].to_i}})
    end
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listId]+" is removed from Category "+
      params[:catName]+"!"}
    
   render :json=>result, :callback => params[:callback]
 end
 
 
 
 def AddImagesToViewlist
   if params[:images] == nil
     result = {"Status"=>"failure", "Message"=>"No image ids!"}
     render :json=>result, :callback => params[:callback]
     return     
   end
   
   if params[:listId] == nil
     result = {"Status"=>"failure", "Message"=>"No viewlist id!"}
     render :json=>result, :callback => params[:callback]
     return     
   end
   
   @client = MongoClient.new(@@server,@@port)
   @db = @client[@@db_name]
   @db.authenticate(@@username,@@password)  
   
   listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
   if listSet.count == 0
     result = {"Status"=>"failure","Message"=>"Viewlist not found!"}
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   added = []
   
   params[:images].each do |imageId|
     if @db['images'].find({'id'=>imageId.to_i}).count >0 and not listObj['images'].include?imageId.to_i
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$push'=>{'images'=>imageId.to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          added.push(imageId.to_s)       
     end
     
     
   end
   message = 'Images '+added.join(',')+' are added to Viewlist '+params[:listId].to_s+'!'
   result = {'Status'=>'success','Message'=>message}
   render :json=>result, :callback => params[:callback]
 end
 
 
 
 def RemoveImagesFromViewlist
    if params[:images] == nil
      result = {"Status"=>"failure","Message"=>"No image ids!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:listId] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password) 


   listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
   if listSet.count == 0
     result = {"Status"=>"failure","Message"=>"Viewlist not found!"}
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   removed = []  
     
   params[:images].each do |imageId|
     if @db['images'].find({'id'=>imageId.to_i}).count >0 and listObj['images'].include?imageId.to_i
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$pull'=>{'images'=>imageId.to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          
          trashImages = @db['trashes'].find({'type'=>'images'}).to_a[0]['images']
          if not trashImages.include?imageId.to_i
             @db['trashes'].update({'type'=>'images'},{'$push'=>{'images'=>imageId.to_i}})
          end
          removed.push(imageId.to_s)       
     end
     
     
   end   
   
    message = 'Images '+removed.join(',')+' are removed from Viewlist '+params[:listId].to_s+'!'   
    result = {"Status"=>"success","Message"=>message}
    render :json=>result, :callback => params[:callback]
 end
 
 def SaveImgAttr   
    if(params[:id]==nil)
      result = {"Status"=>"failure","Message"=>"No image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    imageSet = @db["images"].find({"id"=>params[:id].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No image found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    hiddenAttrs = {"id"=>1,"callback"=>1,"controller"=>1,"action"=>1}
    
    result = {"Status"=>"success"}
    setHash = {}
    params.each do |key, value|
      if not hiddenAttrs.has_key?(key)
        setHash[key] = value
      end
    end
    @db["images"].update({"id"=>params[:id].to_i},{"$set"=>setHash})
    render :json=>result, :callback => params[:callback]
 end
 
 
 def RenameCategory
    if params[:oldname] == nil
      result = {"Status"=>"failure","Message"=>"No old name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:newname] == nil
      result = {"Status"=>"failure","Message"=>"No new name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:newname] == params[:oldname]
      result = {"Status"=>"success","Message"=>"Category has been renamed!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    catSet = @db["categories"].find({"name"=>params[:oldname]})
    if catSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No category found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if @db["categories"].find({"name"=>params[:newname]}).count > 0
      result = {"Status"=>"failure", "Message"=>params[:newname]+" has been taken, please try another name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    catObj = catSet.to_a[0]
    catObj["viewlists"].each do|listId|
      @db["viewlists"].update({"id"=>listId.to_i},{'$pull'=>{'categories'=>params[:oldname]}})
      @db["viewlists"].update({"id"=>listId.to_i},{'$push'=>{'categories'=>params[:newname]}})
    end
    
    @db["categories"].update({"name"=>params[:oldname]},{"$set"=>{"name"=>params[:newname]}})

    result = {"Status"=>"success", "Message"=>"Category has been renamed!"}
    render :json=>result, :callback => params[:callback]
  end
 
 
 
 def GetViewlistMeta
    if params[:id] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    listSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No viewlist found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Viewlist"=>listSet.to_a[0]}
    render :json=>result, :callback => params[:callback]
  end
  
  def RenameViewlist
    if params[:id] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    listSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No viewlist found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    listObj = listSet.to_a[0]
    listObj['images'].each do |imageId|
      @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[listObj['id'].to_i,listObj['name']]}})
      @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[listObj['id'].to_i,params[:name]]}})
    end
    
    @db["viewlists"].update({"id"=>params[:id].to_i},{"$set"=>{"name"=>params[:name]}})
    result = {"Status"=>"success", "Message"=>"Viewlist name has been updated!"}
    render :json=>result, :callback => params[:callback]
  end
 
 
 
 def getImage
   if params[:id]==nil
      result = {"Status"=>"failure","Message"=>"No image id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    imageSet = @db["images"].find({"id"=>params[:id].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No image found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Image"=>imageSet.to_a[0]}
    render :json=>result, :callback => params[:callback]
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
