class StagController < ApplicationController
  require 'rubygems'
  require 'mongo'
  require 'json'
  include Mongo

  
  #@@server = 'ds047478.mongolab.com'
  #@@port = 47478
  #@@db_name = 'heroku_app16778260'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'
  
  #@@server = 'ds051518-a0.mongolab.com'
  #@@port = 51518
  #@@db_name = 'heroku_app16777800'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'

  @@server = 'ds053468-a0.mongolab.com'
  @@port = 53468
  @@db_name = 'heroku_app16778260'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'  


 def setFeatured 
   if params[:listId] == nil or params[:listId].strip.length==0
      result = {"Status"=>"failure","Message"=>"No list id provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   if params[:flag] == nil or params[:flag].strip.length==0
      result = {"Status"=>"failure","Message"=>"No flag provided!"}
      render :json=>result, :callback => params[:callback]
      return
   end   

    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    listSet = @db['viewlists'].find({'id'=>params[:listId].to_i}) 
    if listSet.count == 0
      result = {"Status"=>"failure","Message"=>"No viewlist found!"}
       @client.close
      render :json=>result, :callback => params[:callback]    
      return  
    end  
    
    flag = false;
    if params[:flag] == 'true'
      flag = true;
    end
    
    listObj = listSet.to_a[0]
    @db['viewlists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'featured'=>flag}})

    if listObj['categories'] == nil
      result = {"Status"=>"success","Message"=>"the viewlist's flag is set!"}
       @client.close
      render :json=>result, :callback => params[:callback] 
      return        
    end
    
    
    miniListObj = {}
    miniListObj['name'] = listObj['name']
    miniListObj['id'] = listObj['id']
    miniListObj['featured'] = flag
    
    if listObj['coverImage'] != nil
      miniListObj['coverImage'] = listObj['coverImage']
    end
    if listObj['images'] != nil
      miniListObj['imageNum'] = listObj['images'].length
    end
    
    
    listObj['categories'].each do |catName|
      catSet = @db['categories'].find({'name'=>catName}, {:fields=>['name','featuredLists','featuredLists2','featuredListNum']})
      if catSet.count > 0
        catObj = catSet.to_a[0]
        if catObj['featuredLists'] == nil
          catObj['featuredLists'] = []
          catObj['featuredLists2'] = []
          catObj['featuredListNum'] = 0
        end
        
        if flag #insert the list to the category
          # if the list is not yet in the category
          if catObj['featuredLists'].index(listObj['id'].to_i) == nil
            catObj['featuredLists'].push(listObj['id'].to_i)
            catObj['featuredLists2'].push(miniListObj)
            catObj['featuredListNum'] += 1
          end
          
        else #remove the list from the category
          oldIndex = catObj['featuredLists'].index(listObj['id'].to_i) #check if the list is in the category
          if oldIndex!= nil #if in the category then remove it
            catObj['featuredLists'].delete_at(oldIndex)
            catObj['featuredLists2'].delete_at(oldIndex)
            catObj['featuredListNum'] -= 1
          end
          
        end
        
        #update the database
        @db['categories'].update({'name'=>catName},{'$set'=>{'featuredLists'=>catObj['featuredLists'], 
          'featuredLists2'=>catObj['featuredLists2'], 'featuredListNum'=>catObj['featuredListNum']}})
      
        
      end
      
    end
    result = {"Status"=>"success","Message"=>"the viewlist's flag is set!"}
     @client.close
    render :json=>result, :callback => params[:callback]  
   
     
 end  
  
 def getViewlist
    if(params[:id]==nil)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    

    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    

    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      images = @db["imageRatings"].find({"user_email"=>params[:email].strip.downcase}).to_a
      
      
      
      images.each do|image|      
        imageSet = @db["images"].find({"id"=>image["img_id"].to_i})
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           imageObj["User Rating"]=image["rating"]

           if image["rating"].to_i > 0
              viewlist["imageSet"].append(imageObj)
              viewlist["images"].append(image["img_id"].to_i)
           end
        end
      end
      
      @db["viewlists"].remove({"id"=>params[:id]})
      @db["viewlists"].insert(viewlist)
      viewlist.delete("_id")
       @client.close
      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
       @client.close
      render :json=>result, :callback => params[:callback]
    end
    
    viewlist = viewlistSet.to_a[0] 
    viewlist["imageSet"]=[]
    
    
    
    viewlist["images"].each do|image|
      
      imageSet = @db["images"].find({"id"=>image.to_i})
      if imageSet.count > 0
        
        
        imageObj = imageSet.to_a[0]
        if params[:email]!=nil
           ratingSet = @db["imageRatings"].find({"img_id"=>image.to_i,"user_email"=>(params[:email].strip).downcase})
           if ratingSet.count> 0
             ratingObj = ratingSet.to_a[0]
             imageObj["User Rating"]=ratingObj["rating"]
           end
        end
        
        viewlist["imageSet"].append(imageObj)
      end
    end
    
    viewlist.delete("_id")
     @client.close
    render :json=>viewlist, :callback => params[:callback]
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end   
    
    @db['categories'].remove({"name"=>params[:name]})
    @db['viewlists'].update({},{"$pull"=>{"categories"=>params[:name]}},opts={:upsert=>false, :multi=>true})  
    result = {"Status"=>"success", "Message"=>"Category "+params[:name]+" is removed!"}
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    catObj = {'name'=>params[:name], 'viewlists'=>[], 'viewlists2'=>[], 
      'viewlistNum'=>0, 'featuredListNum' =>0, 'featuredLists'=>[], 'featuredLists2'=>[]}
    @db["categories"].insert(catObj)
    result = {"Status"=>"success","Message"=>"Category "+params[:name]+" is created!"}
     @client.close
    render :json=>result, :callback => params[:callback]      
 end
 
 def createImage
   if params[:listId] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return    
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
    
    listSet = @db["viewlists"].find({"id"=>params[:listId].to_i})  
    if listSet.count == 0  
      result = {"Status"=>"failure","Message"=>"Viewlist doesn't exit!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end 
     
    listObj = listSet.to_a[0]
    miniListArr = []
    miniListArr[0] = listObj['id']
    miniListArr[1] = listObj['name']
    
    currIndex = @db['index'].find().to_a[0]['image'].to_i+1
    
    imageObj = {'id'=>currIndex, 'viewlists'=>[params[:listId].to_i], 'viewlists2'=>[miniListArr]}
    
    @db['index'].update({},{'$set'=>{'image'=>currIndex}})
    @db['images'].insert(imageObj)
    @db['viewlists'].update({'id'=>params[:listId].to_i},{'$push'=>{'images'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"A blank image is created!","imageId"=>currIndex}
     @client.close
    render :json=>result, :callback => params[:callback]
 end
  
 
 def clearImages
    if params[:images] == nil
      result = {"Status"=>"failure","Message"=>"No image ids!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)  
    
     
    params[:images].each do |imageId|
      imageSet = @db['images'].find({'id'=>imageId.to_i})
      if imageSet.count > 0
        imageObj = imageSet.to_a[0]
        imageObj['viewlists'].each do |listId|

          listSet = @db['viewlists'].find({'id'=>listId.to_i})
          if listSet.count > 0
            listObj = listSet.to_a[0]
            if listObj['images']!= nil 
               oldIndex = listObj['images'].index(imageObj['id'].to_i)
               
               if oldIndex != nil
                 @db['viewlists'].update({'id'=> listId.to_i},{'$pull'=>{'images'=>imageObj['id'].to_i}})
                 
                 listObj['categories'].each do |catName|
                   catSet = @db['categories'].find({'name'=>catName})
                   if catSet.count > 0
                     catObj = catSet.to_a[0]
                     
                     #viewlists2
                     oldIndex = catObj['viewlists'].index(listObj['id'].to_i)
                     if oldIndex != nil
                       catObj['viewlists2'][oldIndex]['imageNum']-=1
                     end
                     
                     
                     
                     #featuredLists2
                     oldIndex = catObj['featuredLists'].index(listObj['id'].to_i)
                     if oldIndex != nil
                       catObj['featuredLists2'][oldIndex]['imageNum'] -= 1
                     end                     
                     
                     
                   end
                 end
                 
                 
               end
              
            end
            
          end
          
        end
        @db['images'].remove({'id'=>imageObj['id'].to_i})
      end    
    end
    
    result = {"Status"=>"success","Message"=>"The images have been cleared from the database!"}
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    currIndex = @db['index'].find().to_a[0]['viewlist'].to_i+1
    
    listObj = {'name'=>params[:listName], 'categories'=>[params[:catName]], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[]}
      
    @db['viewlists'].insert(listObj)
    @db['categories'].update({'name'=>params[:catName]},{'$push'=>{'viewlists'=>currIndex}})
    
    miniListObj = {}
    miniListObj['name'] = listObj['name']
    miniListObj['id'] = listObj['id']
    miniListObj['imageNum'] = 0
    miniListObj['featured'] = false
    miniListObj['coverImage'] = nil
    
    @db['categories'].update({'name'=>params[:catName]},{'$push'=>{'viewlists2'=>miniListObj}})

    
    @db['index'].update({},{'$set'=>{'viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}
     @client.close
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
    
    catSet = @db["categories"].find({"name"=>params[:catName]})
    if catSet.count == 0  
      result = {"Status"=>"failure","Message"=>"Cateogry doesn't exit!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    listSet = @db["viewlists"].find({"id"=>params[:listId].to_i})
    if listSet.count == 0  
      result = {"Status"=>"failure","Message"=>"Viewlist doesn't exit!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    catObj = catSet.to_a[0]
    listObj = listSet.to_a[0]
    @db['viewlists'].update({"id"=>params[:listId].to_i},{'$pull'=>{'categories'=>params[:catName]}})
    
    #viewlists
    #viewlists2
    #viewlistNum
    oldIndex = catObj['viewlists'].index(listObj['id'].to_i)
    if oldIndex != nil
      catObj['viewlists'].delete_at(oldIndex)
      catObj['viewlists2'].delete_at(oldIndex)
      catObj['viewlistNum'] -= 1
    end
    
    #featuredLists
    #featuredLists2
    #featuredListNum
    
    oldIndex = catObj['featuredLists'].index(listObj['id'].to_i)
    if oldIndex != nil
      catObj['featuredLists'].delete_at(oldIndex)
      catObj['featuredLists2'].delete_at(oldIndex)
      catObj['featuredListNum'] -= 1
    end
    
    @db['categories'].update({"name"=>params[:catName]},{'$set'=>{'viewlists'=>catObj['viewlists'],
      'viewlists2'=>catObj['viewlists2'],'viewlistNum'=> catObj['viewlistNum'],
      'featuredLists'=>catObj['featuredLists'], 'featuredLists2'=>catObj['featuredLists2'],
      'featuredListNum'=>catObj['featuredListNum']}})
        
    trashLists = @db['trashes'].find({'type'=>'viewlists'}).to_a[0]['viewlists']
    if not trashLists.include?params[:listId].to_i and listObj['categories'].length == 1
      @db['trashes'].update({'type'=>'viewlists'},{'$push'=>{'viewlists'=>params[:listId].to_i}})
    end
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listId]+" is removed from Category "+
      params[:catName]+"!"}
      
    @client.close 
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
      @client.close
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   added = []
   imageNum = listObj['images'].length
   
   
   params[:images].each do |imageId|
     imageSet = @db['images'].find({'id'=>imageId.to_i})
     
     if imageSet.count >0 and not listObj['images'].include?imageId.to_i
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$push'=>{'images'=>imageId.to_i}})
          imageNum += 1
          
          imageObj = imageSet.to_a[0]
          
          if imageObj['viewlists']!=nil and imageObj['viewlists'].length == 0
            @db['trashes'].update({'type'=>'images'},{'$pull'=>{'images'=>imageId.to_i}})
          end

          
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          added.push(imageId.to_s)       
     end
     
     listObj['categories'].each do |catName|
       catSet = @db['categories'].find({'name'=> catName})
       if catSet.count > 0
         catObj = catSet.to_a[0]
         
         oldIndex = catObj['viewlists'].index(listObj['id'].to_i)
         if oldIndex != nil
           catObj['viewlists2'][oldIndex]['imageNum'] = imageNum
         end
         
         oldIndex = catObj['featuredLists'].index(listObj['id'].to_i)
         if oldIndex != nil
           catObj['featuredLists2'][oldIndex]['imageNum'] = imageNum
         end 
         
         @db['categories'].update({'name'=>catName},{'$set'=>{'viewlists2'=>catObj['viewlists2'],
            'featuredLists2'=>catObj['featuredLists2']}})
         
       end
     end
     
     
   end
   message = 'Images '+added.join(',')+' are added to Viewlist '+params[:listId].to_s+'!'
   result = {'Status'=>'success','Message'=>message}
    @client.close
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
      @client.close
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   removed = []  
   imageNum = listObj['images'].length 
     
   params[:images].each do |imageId|
     imageSet = @db['images'].find({'id'=>imageId.to_i})

     if imageSet.count >0 and listObj['images'].include?imageId.to_i
         
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$pull'=>{'images'=>imageId.to_i}})
          imageNum -= 1
          imageObj = imageSet.to_a[0]
          
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          
          trashImages = @db['trashes'].find({'type'=>'images'}).to_a[0]['images']
          if not trashImages.include?imageId.to_i and imageObj['viewlists'].length == 1
             @db['trashes'].update({'type'=>'images'},{'$push'=>{'images'=>imageId.to_i}})
          end
          removed.push(imageId.to_s)       
     end


     listObj['categories'].each do |catName|
       catSet = @db['categories'].find({'name'=> catName})
       if catSet.count > 0
         catObj = catSet.to_a[0]
         
         oldIndex = catObj['viewlists'].index(listObj['id'].to_i)
         if oldIndex != nil
           catObj['viewlists2'][oldIndex]['imageNum'] = imageNum
         end
         
         oldIndex = catObj['featuredLists'].index(listObj['id'].to_i)
         if oldIndex != nil
           catObj['featuredLists2'][oldIndex]['imageNum'] = imageNum
         end 
         
         @db['categories'].update({'name'=>catName},{'$set'=>{'viewlists2'=>catObj['viewlists2'],
            'featuredLists2'=>catObj['featuredLists2']}})
         
       end
     end     
     
     
   end   
   
    message = 'Images '+removed.join(',')+' are removed from Viewlist '+params[:listId].to_s+'!'   
    result = {"Status"=>"success","Message"=>message}
     @client.close
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
       @client.close
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
     @client.close
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
    

    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    catSet = @db["categories"].find({"name"=>params[:oldname]})
    if catSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No category found!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if @db["categories"].find({"name"=>params[:newname]}).count > 0
      result = {"Status"=>"failure", "Message"=>params[:newname]+" has been taken, please try another name!"}
       @client.close
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
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Viewlist"=>listSet.to_a[0]}
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    listObj = listSet.to_a[0]
    listObj['images'].each do |imageId|
      @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[listObj['id'].to_i,listObj['name']]}})
      @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[listObj['id'].to_i,params[:name]]}})
    end
    
    listObj['categories'].each do |catName|
      catSet = @db['categories'].find({'name'=>catName})
      if catSet.count > 0
        catObj = catSet.to_a[0]
        
        oldIndex = catObj['viewlists'].index(listObj['id'].to_i)
        if oldIndex != nil
          catObj['viewlists2'][oldIndex]['name'] = params[:name]
        end
        
        oldIndex = catObj['featuredLists'].index(listObj['id'].to_i)
        if oldIndex != nil
          catObj['featuredLists2'][oldIndex]['name'] = params[:name]
        end
        
        @db['categories'].update({'name'=>catName},{'$set'=>{'viewlists2'=>catObj['viewlists2'],
          'featuredLists2'=>catObj['featuredLists2']}})
      end
    end
    
    @db["viewlists"].update({"id"=>params[:id].to_i},{"$set"=>{"name"=>params[:name]}})
    result = {"Status"=>"success", "Message"=>"Viewlist name has been updated!"}
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Image"=>imageSet.to_a[0]}
     @client.close
    render :json=>result, :callback => params[:callback]
 end
  
 def allCategories
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {"categories"=>@db["categories"].find().sort({"name"=>1}).to_a}
     @client.close
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
       @client.close
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    processedLists = []
    
    params[:lists].each do |listId|
      listSet = @db['viewlists'].find({'id'=>listId.to_i})
      if listSet.count > 0 and not category["viewlists"].include? listId.to_i
        listObj = listSet.to_a[0]
        miniListObj = {}
        miniListObj['name'] = listObj['name']
        miniListObj['id'] = listObj['id']
        
        if listObj['featured'] != nil
           miniListObj['featured'] = listObj['featured']
        else
           miniListObj['featured'] = false
        end
        
        category["viewlists"].push(listObj['id'])
        category["viewlists2"].push(miniListObj)
        category["viewlistNum"] += 1
        
        if miniListObj['featured'] == true
          category["featuredLists"].push(listObj['id'])
          category["featuredLists2"].push(miniListObj)
          category["featuredListNum"] += 1
        end
        processedLists.push(list.to_i)
        
      end
        
    end
    
    
    @db["categories"].update({"name"=>params[:catName]},{"$set"=>{"viewlists"=>category["viewlists"],
      'viewlists2'=>category['viewlists2'], 'viewlistNum'=>category['viewlistNum'],
      'featuredLists'=> category['featuredLists'], 'featuredLists2'=>category['featuredLists2'],
      'featuredListNum' => category['featuredListNum']}})
      
    result = {"status"=>"success", "message"=> "Viewlists "+processedLists.join(', ') +' are added to Category '+params[:catName]}
     @client.close
    render :json=>result, :callback => params[:callback]
    return
    
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
    
    
    catSet = @db["categories"].find({"name"=>params[:catName]},{:fields=>['viewlists2', 'featuredLists']})
    if catSet.count == 0
      result = {"status"=>"failure", "message"=>"category doesn't exist!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
      
    end
    
    category = catSet.to_a[0]
    viewlists = category['viewlists2']
    if params[:catName] == 'Artist'
       lastNameQuickSort(viewlists,0,viewlists.length-1)      
    else
       quickSort(viewlists,0,viewlists.length-1)    
    end
    result = {"status"=>"success", "viewlists"=>viewlists, "featuredLists"=>category['featuredLists']}
     @client.close
    render :json=>result, :callback => params[:callback]  
 end
 
 
  def allCategories2
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {"categories"=>@db["categories"].find({},{:fields=>['name','viewlistNum']}).sort({"name"=>1}).to_a}
     @client.close
    render :json=>result, :callback => params[:callback]  
  end 
  
  
  def getTrashImages
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    trashSet = @db['trashes'].find({'type'=>'images'})
    trashList = {}
    trashList['images'] = []
    trashList['imageSet'] = []
    trashList['name'] = 'Trash Images'
    
    if trashSet.count > 0
      trashObj = trashSet.to_a[0]
      if trashObj['images']!= nil
        trashList['images'] = trashObj['images']
      end
     
      trashList['images'].each do |imageId|
        imageColl = @db['images'].find({'id'=>imageId.to_i})
        if imageColl.count > 0
          imageObj = imageColl.to_a[0]
          trashList['imageSet'].push(imageObj)
        end
      end
    
    end
    
    result = trashList
     @client.close
    render :json=>result, :callback => params[:callback]      
    
   
  end
  

  
end  
