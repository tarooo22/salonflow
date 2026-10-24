-- Adds the beauty marketplace categories (sortOrder 0-7, before aesthetics/dental at 8+).
-- Idempotent: INSERT IGNORE on the unique slug/id. Run with a utf8mb4 connection.
-- The vertical is derived from the slug (client/src/lib/verticals.ts): "cosmetology" is aesthetics, the rest beauty.
INSERT IGNORE INTO `marketplace_categories` (`id`,`slug`,`nameKa`,`nameEn`,`nameRu`,`iconKey`,`sortOrder`,`isActive`) VALUES
  ('mp_cat_beauty_hair_001','hair','თმა','Hair','Волосы','scissors',0,true),
  ('mp_cat_beauty_nails_001','nails','ფრჩხილები','Nails','Ногти','sparkles',1,true),
  ('mp_cat_beauty_makeup_001','makeup','მაკიაჟი','Makeup','Макияж','brush',2,true),
  ('mp_cat_beauty_brows_001','brows-lashes','წარბები და წამწამები','Brows & lashes','Брови и ресницы','eye',3,true),
  ('mp_cat_beauty_massage_001','massage-spa','მასაჟი და სპა','Massage & spa','Массаж и спа','flower-2',4,true),
  ('mp_cat_beauty_barber_001','barber','ბარბერი','Barber','Барбер','user-round',5,true),
  ('mp_cat_beauty_epilation_001','epilation','ეპილაცია','Hair removal','Эпиляция','zap',6,true),
  ('mp_cat_cosmetology_001','cosmetology','კოსმეტოლოგია','Cosmetology','Косметология','droplet',7,true);
