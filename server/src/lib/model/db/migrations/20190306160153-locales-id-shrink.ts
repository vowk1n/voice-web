export const up = async function(db: any): Promise<any> {
  return db.runSql(
    `
      BEGIN;

      RENAME TABLE locales TO old_locales;

      CREATE TABLE locales (
        id smallint(5) unsigned NOT NULL AUTO_INCREMENT,
        name text CHARACTER SET utf8 NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY name_idx (name(10))
      );

      INSERT INTO locales (name) SELECT name FROM old_locales;

      SET FOREIGN_KEY_CHECKS = 0;
      UPDATE clips SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = clips.locale_id
        )
      );
      UPDATE sentences SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = sentences.locale_id
        )
      );
      UPDATE downloaders SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = downloaders.locale_id
        )
      );
      UPDATE user_client_accents SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = user_client_accents.locale_id
        )
      );
      UPDATE user_client_activities SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = user_client_activities.locale_id
        )
      );
      UPDATE user_client_locale_buckets SET locale_id = (
        SELECT id FROM locales WHERE name IN (
          SELECT name from old_locales WHERE id = user_client_locale_buckets.locale_id
        )
      );
      SET FOREIGN_KEY_CHECKS = 1;

      COMMIT;
    `
  );
};

export const down = function(): Promise<any> {
  return null;
};
