// api/redirect.js - Vercel Serverless Function
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { 
      service, 
      restaurant = '', 
      address = '', 
      utm_source = '', 
      utm_medium = '', 
      utm_campaign = '',
      timestamp = ''
    } = req.query;

    // Log analytics data
    console.log('🔗 CleanPlate Affiliate Click:', {
      service,
      restaurant,
      address,
      utm_source,
      utm_medium,
      utm_campaign,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    // Build affiliate URLs with tracking
    const buildUrl = (baseUrl, params) => {
      const urlParams = new URLSearchParams({
        ...params,
        utm_source: 'cleanplate',
        utm_medium: 'mobile_app',
        utm_campaign: 'restaurant_affiliate',
        utm_content: service
      });
      return `${baseUrl}?${urlParams.toString()}`;
    };

    const affiliateUrls = {
      doordash: buildUrl('https://www.doordash.com/search/', {
        q: restaurant,
        // Add your DoorDash affiliate ID here when approved:
        // affiliate_id: 'YOUR_DOORDASH_AFFILIATE_ID'
      }),
      
      ubereats: buildUrl('https://www.ubereats.com/search', {
        q: restaurant,
        // Add your Uber Eats partner ID here when approved:
        // partner_id: 'YOUR_UBEREATS_PARTNER_ID'
      }),
      
      grubhub: buildUrl('https://www.grubhub.com/search', {
        queryText: restaurant,
        // Add your Grubhub affiliate ID here when approved:
        // affiliate: 'YOUR_GRUBHUB_AFFILIATE_ID'
      }),
      
      postmates: buildUrl('https://postmates.com/search/' + encodeURIComponent(restaurant), {
        // Postmates tracking parameters
      })
    };

    const targetUrl = affiliateUrls[service];
    
    if (!targetUrl) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        valid_services: Object.keys(affiliateUrls) 
      });
    }

    // Redirect to affiliate URL
    res.redirect(302, targetUrl);
    
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}