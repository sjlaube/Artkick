class User1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'

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
  
  @@gmailAccount = 'leonzfarm'  
  @@gmailPassword = 'aljzcsjusqohrujk' 

  def utcMillis
    return (Time.new.to_f*1000).to_i
  end
  
  
  
  def addImageToMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:imgId]==nil or params[:imgId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no image id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    imageSet = @db['images'].find({'id'=>params[:imgId].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, image doesn't exist!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return      

    end
  
    imageObj = imageSet.to_a[0]
    
    listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return  
      
    end
  
    listObj = listSet.to_a[0]
    
    if listObj['coverImage'] == nil
       @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'coverImage'=>imageObj['thumbnail']}})
    end
    
    @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$push'=>{'images'=>imageObj['id'].to_i}})
    
    result = {"Status"=>"success", "Message"=>"The image has been added to the viewlist!"}
    @client.close
    render :json=>result, :callback => params[:callback]
    
 end
 
 
 def removeImageFromMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:imgId]==nil or params[:imgId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no image id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
        
    listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return  
      
    end
  
    listObj = listSet.to_a[0]   
    
    
    imageSet = @db['images'].find({'id'=>params[:imgId].to_i})
    if imageSet.count > 0
       imageObj = imageSet.to_a[0]
       # in case we have removed the cover image
       if imageObj['thumbnail'] == listObj['coverImage']
         leftImages = []
         listObj['images'].each do |imageId|
           if imageId.to_i != params[:imgId].to_i
             leftImages.push imageId.to_i
           end
         end
         
         if leftImages.length > 0
           covImageSet = @db['images'].find({'id'=>leftImages[0].to_i})
           if covImageSet.count > 0
             @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'coverImage'=>covImageSet.to_a[0]['thumbnail']}})
           end
         end
       end

    end
    
    
    @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$pull'=>{'images'=>params[:imgId].to_i}})
    result = {"Status"=>"success", "Message"=>"The image has been removed from the viewlist!"}
    @client.close
    render :json=>result, :callback => params[:callback]
    
 end    
    
  
 def removeMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no listId provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @db['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>params[:listId].to_i}})
    @db['viewlists'].remove({'id'=>params[:listId].to_i})
    
    result = {"Status"=>"success", "Message"=>"The viewlist has been removed!"}
     @client.close
    render :json=>result, :callback => params[:callback]
 end
 
 
 def search
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:keyword] == nil or params[:keyword].strip.length == 0
      result = {"Status"=>"failure", "Message"=>"error, no keyword provided!"}
      render :json=>result, :callback => params[:callback]
      return      
    end
 
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    #search

    listObj = {'images'=>[]}
    keywords = []
    exes = ['museum','art','of', 'not', 'a', 'for', 'copyright','does','by','was',
            'and', 'from', 'at', 'am', 'over', 'away','the','des','di','galerie','collection','church']
             
    params[:keyword].strip.downcase.split.each do|keyword|
      if not exes.include? keyword
        keywords.push(keyword)
      end
    end
    
    keyMap = {}
    

    keywords.each do |keyword|
      imageSet = @db['images'].find({'topics'=>keyword},{:fields=>['id']}).limit(200)
      imageSet.to_a.each do |imageObj|
        if keyMap[imageObj['id'].to_i] == nil
           keyMap[imageObj['id'].to_i] = 1
        else
           keyMap[imageObj['id'].to_i] += 1
        end
      end
    end
    
    keyMap.keys.each do |imageId|
      if keyMap[imageId] == keywords.length
        listObj['images'].push(imageId)
      end
    end
    
    if listObj['images'].length > 0
      coverId = listObj['images'][0]
      imageSet = @db['images'].find({'id'=>coverId},{:fields=>['thumbnail']})
      if imageSet.count > 0
         listObj['coverImage'] = imageSet.to_a[0]['thumbnail']
      end
    end
    
    if userObj['search_list']!=nil
      @db['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>userObj['search_list'].to_i}})
      @db['viewlists'].remove({'id'=>userObj['search_list'].to_i})
    end
          
    currIndex = @db['index'].find().to_a[0]['priv_viewlist'].to_i+1
    listObj['name'] = 'Last Search'
    listObj['id'] = currIndex
    listObj['datetime_created']=Time.now.utc.to_s
    listObj['private_user']=userObj['email']
    @db['viewlists'].insert(listObj)
    if userObj['private_lists'] == nil
       @db['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
       @db['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end 
    @db['index'].update({},{'$set'=>{'priv_viewlist'=>currIndex}}) 
    @db['users'].update({'email'=>userObj['email']},{'$set'=>{'search_list'=>currIndex}})
    userObj['search_list'] = currIndex
      
        
    result = {"Status"=>"success", "Message"=>"A viewlist has been created based on your search", "listId"=>userObj['search_list'].to_i, "images"=>listObj['images']}
     @client.close
    render :json=>result, :callback => params[:callback]     
    
 
 end
 
 
 def saveAsMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
  if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    
    fromListSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
    if fromListSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, list doesn't exist!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    fromListObj = fromListSet.to_a[0]
    if fromListObj['private_user'] == nil
      result = {"Status"=>"failure", "Message"=>"error, this list is not a private list, you don't need to save it!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return      
    end
    
    newname = fromListObj['name']
    fromUserSet = @db['users'].find({'email'=>fromListObj['private_user']})
    if fromUserSet.count > 0
      fromUserObj = fromUserSet.to_a[0]
      if fromUserObj['email']==userObj['email']
        result = {"Status"=>"failure", "Message"=>"error, this is your own viewlist, you don't have to save it again!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return   
      end
      
      
      newname = fromUserObj['name']+': '+newname
    end
    
    
    currIndex = @db['index'].find().to_a[0]['priv_viewlist'].to_i+1
    
    
    listObj = {'name'=>newname, 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>fromListObj['images'], 'private_user'=>userObj['email'], 'coverImage'=>fromListObj['coverImage']}
      
    @db['viewlists'].insert(listObj)
    if userObj['private_lists'] == nil
      @db['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
      @db['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end 
    @db['index'].update({},{'$set'=>{'priv_viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+newname+" is created!", "listId"=>currIndex}
     @client.close
    render :json=>result, :callback => params[:callback] 
 end 
 
 
 
 def createMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
         
  if params[:listName]==nil or params[:listName].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    currIndex = @db['index'].find().to_a[0]['priv_viewlist'].to_i+1
    
    listObj = {'name'=>params[:listName], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[], 'private_user'=>userObj['email']}
      
    @db['viewlists'].insert(listObj)
    if userObj['private_lists'] == nil
      @db['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
      @db['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end 
    @db['index'].update({},{'$set'=>{'priv_viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}
     @client.close
    render :json=>result, :callback => params[:callback] 
 end
 
  def renameMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:newname]==nil or params[:newname].length==0
      result = {"Status"=>"failure", "Message"=>"error, no name provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, this viewlist doesn't belong to the user!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @db['viewlists'].update({'id'=>params[:listId].to_i},{'$set'=>{'name'=>params[:newname]}})
    result = {"Status"=>"success", "Message"=>"The viewlist has been renamed!"}
     @client.close
    render :json=>result, :callback => params[:callback]
  end
 
  def getMyViewlists    
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    if userObj['private_lists'] == nil
      result = {"Status"=>"success", "viewlists"=>[]}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end    
    
    viewlists = []
    userObj['private_lists'].each do |viewlistId|
      viewlistSet = @db['viewlists'].find({'id'=>viewlistId.to_i})
      if viewlistSet.count >0
        viewlists.push(viewlistSet.to_a[0])
      end
    end
    
    quickSort(viewlists,0,viewlists.length-1)
    result = {"Status"=>"success", "viewlists"=>viewlists}
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
    
end  
