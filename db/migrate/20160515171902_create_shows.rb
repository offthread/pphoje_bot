class CreateShows < ActiveRecord::Migration
  def change
    create_table :shows do |t|
	  t.string :name
      t.datetime :date
      t.boolean :is_confirmed
      t.string :link_band
      
      t.timestamps null: false
    end
  end
end
