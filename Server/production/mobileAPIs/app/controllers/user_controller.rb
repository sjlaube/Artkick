class UserController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'

  
  @@server = 'ds031948.mongolab.com'
  @@port = 31948
  @@db_name = 'zwamy'
  @@username = 'leonzwamy'
  @@password = 'zw12artistic'
  
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
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
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
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    imageSet = @db['images'].find({'id'=>params[:imgId].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, image doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return      

    end
  
    imageObj = imageSet.to_a[0]
    
    listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return  
      
    end
  
    listObj = listSet.to_a[0]
    
    if listObj['coverImage'] == nil
       @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'coverImage'=>imageObj['thumbnail']}})
    end
    
    @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$push'=>{'images'=>imageObj['id'].to_i}})
    
    result = {"Status"=>"success", "Message"=>"The image has been added to the viewlist!"}
    render :json=>result, :callback => params[:callback]
    
 end
 
 
 def removeImageFromMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
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
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
      render :json=>result, :callback => params[:callback]
      return
    end
        
    listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}
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
    render :json=>result, :callback => params[:callback]
    
 end    
    
  
 def removeMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no listId provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @db['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>params[:listId].to_i}})
    @db['viewlists'].remove({'id'=>params[:listId].to_i})
    
    result = {"Status"=>"success", "Message"=>"The viewlist has been removed!"}
    render :json=>result, :callback => params[:callback]
 end
 
 
 
 
 
 def createMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
  if params[:listName]==nil or params[:listName].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    currIndex = @db['index'].find().to_a[0]['viewlist'].to_i+1
    
    listObj = {'name'=>params[:listName], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[], 'private_user'=>userObj['email']}
      
    @db['viewlists'].insert(listObj)
    if userObj['private_lists'] == nil
      @db['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
      @db['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end 
    @db['index'].update({},{'$set'=>{'viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}
    render :json=>result, :callback => params[:callback] 
 end
 
  def renameMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
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
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    #userSet = @db['users'].find({'email'=>params[:email].strip.downcase, 'pass_digest'=>params[:token]})
    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, this viewlist doesn't belong to the user!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @db['viewlists'].update({'id'=>params[:listId].to_i},{'$set'=>{'name'=>params[:newname]}})
    result = {"Status"=>"success", "Message"=>"The viewlist has been renamed!"}
    render :json=>result, :callback => params[:callback]
  end
 
  def getMyViewlists    
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:token]==nil or params[:token].length==0
      result = {"Status"=>"failure", "Message"=>"error, no token provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({'email'=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, user cannot be authenticated!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    userObj = userSet.to_a[0]
    if userObj['private_lists'] == nil
      result = {"Status"=>"success", "viewlists"=>[]}
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
