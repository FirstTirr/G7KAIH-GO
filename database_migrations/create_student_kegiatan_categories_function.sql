-- Provide a security-definer helper so students can read kegiatan categories and fields
DROP FUNCTION IF EXISTS public.student_get_kegiatan_categories(uuid);
CREATE FUNCTION public.student_get_kegiatan_categories(p_kegiatanid uuid)
RETURNS TABLE (
  categoryid uuid,
  categoryname text,
  inputs jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.categoryid::uuid AS categoryid,
    c.categoryname::text AS categoryname,
    COALESCE(
      (
        SELECT jsonb_agg(
                 jsonb_build_object(
                   'key', cf.field_key,
                   'label', cf.label,
                   'type', cf.type,
                   'required', cf.required,
                   'order', cf.order_index,
                   'config', cf.config
                 )
                 ORDER BY cf.order_index NULLS LAST
               )
        FROM public.category_fields cf
        WHERE cf.categoryid = c.categoryid
      ),
      '[]'::jsonb
    ) :: jsonb AS inputs
  FROM public.kegiatan_categories kc
  JOIN public.category c ON c.categoryid = kc.categoryid
  WHERE kc.kegiatanid = p_kegiatanid;
$$;

GRANT EXECUTE ON FUNCTION public.student_get_kegiatan_categories(uuid) TO authenticated;
