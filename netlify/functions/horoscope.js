exports.handler = async () => {
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 const base=(process.env.EPHEMERIS_API_URL||'').replace(/\/+$/,'');
 if(!base) return {statusCode:503,headers,body:JSON.stringify({error:'Configura EPHEMERIS_API_URL in Netlify.'})};
 const signs=['Ariete','Toro','Gemelli','Cancro','Leone','Vergine','Bilancia','Scorpione','Sagittario','Capricorno','Acquario','Pesci'];
 const planets=['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO'];
 const it={Aries:'Ariete',Taurus:'Toro',Gemini:'Gemelli',Cancer:'Cancro',Leo:'Leone',Virgo:'Vergine',Libra:'Bilancia',Scorpio:'Scorpione',Sagittarius:'Sagittario',Capricorn:'Capricorno',Aquarius:'Acquario',Pisces:'Pesci'};
 try {
  const now=new Date();
  const r=await fetch(base+'/api/v1/planets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({datetime:now.toISOString(),timezone:'Europe/Rome',latitude:37.5079,longitude:15.0830,planets,ayanamsa:'TROPICAL',house_system:'P'})});
  if(!r.ok) throw new Error('Effemeridi HTTP '+r.status);
  const raw=await r.json(); if(!Array.isArray(raw.positions)) throw new Error('Formato effemeridi non valido');
  const pos={}; for(const p of raw.positions) pos[p.planet]={sign:it[p.sign]||p.sign,degree:p.degree_in_sign,retrograde:!!p.retrograde};
  for(const p of planets) if(!pos[p]) throw new Error('Dato mancante: '+p);
  const at=p=>pos[p].sign, horoscopes={};
  for(const s of signs) horoscopes[s]={amore:`Venere in ${at('VENUS')} richiama affetti e reciprocità; la Luna in ${at('MOON')} invita ad ascoltare le emozioni.`,lavoro:`Mercurio in ${at('MERCURY')} porta l'attenzione sulla comunicazione; il Sole in ${at('SUN')} evidenzia il tema generale del giorno.`,energia:`Marte in ${at('MARS')} descrive simbolicamente l'iniziativa; Giove in ${at('JUPITER')} richiama crescita e prospettive.`,consiglio:`Saturno in ${at('SATURN')} invita a procedere con metodo e a valutare i fatti prima di decidere.`};
  return {statusCode:200,headers,body:JSON.stringify({calculated_at:now.toISOString(),transits:pos,horoscopes,source:'Swiss Ephemeris API'})};
 } catch(e){console.error(e);return {statusCode:503,headers,body:JSON.stringify({error:'Transiti non disponibili. Verifica l’istanza delle effemeridi.'})};}
};
