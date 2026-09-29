// api/index.js — proyecto separado SOLO para resolver el link corto de derivación
// (ver wa_links en el proyecto principal de Renoval). Vive en un dominio propio,
// distinto al de la app instalada como PWA, para que Android no intercepte el
// link y lo abra dentro de la PWA en vez del navegador normal — que es lo que
// impedía el salto a la app nativa de WhatsApp.
//
// URL de uso: https://<este-proyecto>.vercel.app/api?l=<codigo>

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  try {
    const codigo = req.query.l;
    if (!codigo) return res.status(400).send('Link inválido');

    const { data: link } = await supabase
      .from('wa_links')
      .select('telefono_destino, mensaje, clicked_at')
      .eq('id', codigo)
      .maybeSingle();

    if (!link) return res.status(404).send('Link no encontrado o expirado');

    if (!link.clicked_at) {
      await supabase.from('wa_links').update({ clicked_at: new Date().toISOString() }).eq('id', codigo);
    }

    const url = `https://wa.me/${link.telefono_destino}${link.mensaje ? `?text=${encodeURIComponent(link.mensaje)}` : ''}`;
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error('Error en redirector de links:', err.message);
    res.status(500).send('Error interno');
  }
};
