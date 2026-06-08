/**
 * Full cafe menu — prices in Indian Rupees (₹)
 */
const CAFE_MENU = {
    coffee: [
        { id: 'c1', name: 'Filter Kaapi', desc: 'Traditional South Indian decoction with frothy milk.', price: 120, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80' },
        { id: 'c2', name: 'Masala Chai', desc: 'Spiced tea brewed with ginger, cardamom and cinnamon.', price: 99, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80' },
        { id: 'c3', name: 'Cedar Espresso', desc: 'Double-shot espresso roasted in-house.', price: 180, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80' },
        { id: 'c4', name: 'Canopy Cappuccino', desc: 'Silky foam over rich espresso and forest honey.', price: 220, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
        { id: 'c5', name: 'Mocha Mist', desc: 'Dark chocolate folded into steamed milk and espresso.', price: 250, image: 'https://images.unsplash.com/photo-1578374173042-9b6d3a3a2f6a?w=400&q=80' },
        { id: 'c6', name: 'Cold Brew Tonic', desc: '18-hour cold brew with citrus and tonic sparkle.', price: 280, image: 'https://images.unsplash.com/photo-1461023058943-f07a80c5775f?w=400&q=80' }
    ],
    fastfood: [
        { id: 'f1', name: 'Wood-Fired Paneer Wrap', desc: 'Grilled paneer, mint chutney, salad in rumali roti.', price: 320, image: 'https://images.unsplash.com/photo-1626700051175-6818013e5786?w=400&q=80' },
        { id: 'f2', name: 'Treehouse Veg Burger', desc: 'Crispy patty, cheddar, caramelised onion, brioche bun.', price: 349, image: 'https://images.unsplash.com/photo-1568901346718-0a5b566fa129?w=400&q=80' },
        { id: 'f3', name: 'Masala Fries', desc: 'Crispy fries tossed in chaat masala and lime.', price: 199, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
        { id: 'f4', name: 'Grilled Sandwich', desc: 'Triple-layer veg grill with pesto and mozzarella.', price: 275, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
        { id: 'f5', name: 'Pasta Primavera', desc: 'Penne with seasonal vegetables in herb cream sauce.', price: 380, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80' }
    ],
    desserts: [
        { id: 'd1', name: 'Gulab Jamun Cheesecake', desc: 'Cream cheese mousse with rose syrup and pistachio.', price: 320, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' },
        { id: 'd2', name: 'Chocolate Lava Cake', desc: 'Warm fondant with vanilla bean ice cream.', price: 299, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80' },
        { id: 'd3', name: 'Forest Berry Tart', desc: 'Butter crust, custard, wild berries from the valley.', price: 280, image: 'https://images.unsplash.com/photo-1464349095430-e2a172ba2bc0?w=400&q=80' },
        { id: 'd4', name: 'Tiramisu Jar', desc: 'Espresso-soaked sponge layered with mascarpone.', price: 310, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
        { id: 'd5', name: 'Cinnamon Roll', desc: 'Freshly baked roll with cream cheese frosting.', price: 180, image: 'https://images.unsplash.com/photo-1607478900763-ef1875b9dab6?w=400&q=80' }
    ],
    beverages: [
        { id: 'b1', name: 'Fresh Lime Soda', desc: 'Sweet or salted — refreshingly tangy.', price: 120, image: 'https://images.unsplash.com/photo-1546173159-315724a25696?w=400&q=80' },
        { id: 'b2', name: 'Mango Lassi', desc: 'Alphonso mango blended with yogurt and saffron.', price: 180, image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
        { id: 'b3', name: 'Iced Matcha', desc: 'Ceremonial grade matcha over oat milk and ice.', price: 260, image: 'https://images.unsplash.com/photo-1515823064-df3fdb9c062e?w=400&q=80' },
        { id: 'b4', name: 'Virgin Mojito', desc: 'Mint, lime, soda — perfect on the open deck.', price: 199, image: 'https://images.unsplash.com/photo-1551024709-8f23be76a62d?w=400&q=80' },
        { id: 'b5', name: 'Kokum Sharbat', desc: 'Coastal kokum cooler with rock salt.', price: 140, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' }
    ],
    specials: [
        { id: 's1', name: 'Chef\'s Treehouse Thali', desc: 'Seasonal mains, bread, rice, dessert & beverage.', price: 699, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
        { id: 's2', name: 'Sunset Deck Platter', desc: 'For two — dips, grills, salad and mocktails.', price: 999, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80' },
        { id: 's3', name: 'Monsoon Soup Bowl', desc: 'Chef\'s daily soup with artisan sourdough.', price: 350, image: 'https://images.unsplash.com/photo-1547592160-23ac45744acd?w=400&q=80' },
        { id: 's4', name: 'Canopy Breakfast', desc: 'Eggs, hash, toast, juice and unlimited coffee.', price: 549, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80' }
    ]
};

window.CAFE_MENU = CAFE_MENU;
