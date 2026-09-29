-- New out-of-line values (article bodies, report content, the search copy) are compressed with lz4,
-- which decompresses several times faster than the default pglz. The "全文相关" search reads the
-- stored body of every candidate, so this roughly halves that step. Existing values keep their
-- compression until they are rewritten.
--
-- 本地适配（MedHOT on macOS）：本机 PostgreSQL 16.2 是用 pgserver 的预编译包装的，没编译 lz4 支持，
-- 所以这里在服务器不支持 lz4 时降级为默认的 pglz，并留下 NOTICE。功能不受影响，只是全文相关搜索慢一些。
-- 换到支持 lz4 的服务器（Docker 官方镜像自带）后，这条迁移会自动按原样生效。
DO $$
BEGIN
  BEGIN
    EXECUTE format('ALTER DATABASE %I SET default_toast_compression = lz4', current_database());
  EXCEPTION WHEN invalid_parameter_value THEN
    RAISE NOTICE 'lz4 不可用（本机 PostgreSQL 未编译 lz4），保持默认 pglz';
  END;
  BEGIN
    EXECUTE 'ALTER TABLE pool_search ALTER COLUMN body SET COMPRESSION lz4';
  EXCEPTION WHEN invalid_parameter_value OR feature_not_supported THEN
    EXECUTE 'ALTER TABLE pool_search ALTER COLUMN body SET COMPRESSION pglz';
  END;
END $$;
