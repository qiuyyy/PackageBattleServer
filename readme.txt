shell  mongosh
显示所有数据库 show dbs
切换数据库 use <数据库名>
显示所有集合名 show collections
查询集合内文档 db.<集合名>.find([{...}]) /db.<集合名>.findOne([{...}])
删除集合内文档 db.<集合名>.deleteMany([{...}]) /db.<集合名>.deleteOne([{...}])
更改文档 db.<集合名>.updateOne({...},{$set: {...}})

启动数据库 mongod

例：
删除某玩家  db.users.deleteOne({nickname:"玩家735f8543"})
刷新每日数据 db.users.updateOne({nickname:"玩家735f8543"},{$set:{last_login_time:0}})
某玩家修改金币数 db.users.updateOne({nickname:"玩家735f8543"},{$set:{Gold:10000}})
        (多级)  db.users.updateOne({nickname:"玩家735f8543"},{$set:{"cardlucky.luckyQuailty":10000}})
