import db, pipeline

data_base = db.DataBase()
data_base.set_write_mode()
pipeline.init_pipeline(data_base)
data_base.set_read_mode()
