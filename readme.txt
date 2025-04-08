shell  mongosh
显示所有数据库 show dbs
切换数据库 use <数据库名>
显示所有集合名 show collections
查询集合内文档 db.<集合名>.find([{...}]) /db.<集合名>.findOne([{...}])
删除集合内文档 db.<集合名>.deleteMany([{...}]) /db.<集合名>.deleteOne([{...}])

启动数据库 mongod