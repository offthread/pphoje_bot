class CreateShows < ActiveRecord::Migration
  def change
    create_table :shows do |t|
	  t.string :nome
      t.date :data
      t.boolean :confirmado
      t.string :link_artista
      
      t.timestamps null: false
    end
  end
end
