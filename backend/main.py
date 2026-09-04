import db, pipeline

database = db.DataBase()
database.set_write_mode()

pipeline.init_pipeline(database)

database.set_read_mode()
