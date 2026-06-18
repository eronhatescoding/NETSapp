import { Injectable } from '@angular/core';
import { DayPlan, PlannedActivity, PlannedAlternative } from '../models/day-plan.model';
import { WeatherForecast } from '../models/transaction.model';
import { UserDnaService } from './user-dna.service';

@Injectable({ providedIn: 'root' })
export class DayPlanService {

  // Simulated weather forecasts for future dates (hardcoded for demo)
  private weatherForecasts: Record<string, WeatherForecast> = {
    '2026-06-18': { condition: 'sunny', temperature: 32, humidity: 75, rainChance: 10, description: 'Hot and sunny with clear skies', indoorRecommended: false },
    '2026-06-19': { condition: 'rainy', temperature: 27, humidity: 90, rainChance: 85, description: 'Heavy rain and thunderstorms', indoorRecommended: true },
    '2026-06-20': { condition: 'cloudy', temperature: 29, humidity: 80, rainChance: 40, description: 'Overcast with light drizzle possible', indoorRecommended: false },
    '2026-06-21': { condition: 'sunny', temperature: 31, humidity: 70, rainChance: 5, description: 'Bright and warm', indoorRecommended: false },
    '2026-06-22': { condition: 'stormy', temperature: 26, humidity: 95, rainChance: 95, description: 'Thunderstorms and strong winds', indoorRecommended: true },
    '2026-06-23': { condition: 'sunny', temperature: 33, humidity: 65, rainChance: 0, description: 'Clear and hot', indoorRecommended: false },
    '2026-06-24': { condition: 'cloudy', temperature: 28, humidity: 78, rainChance: 30, description: 'Partly cloudy, comfortable', indoorRecommended: false },
    '2026-06-25': { condition: 'rainy', temperature: 26, humidity: 88, rainChance: 70, description: 'Persistent rain throughout the day', indoorRecommended: true },
    '2026-06-26': { condition: 'sunny', temperature: 32, humidity: 72, rainChance: 15, description: 'Sunny with occasional clouds', indoorRecommended: false },
    '2026-06-27': { condition: 'sunny', temperature: 34, humidity: 68, rainChance: 5, description: 'Very hot and dry', indoorRecommended: false },
    '2026-06-28': { condition: 'cloudy', temperature: 29, humidity: 76, rainChance: 35, description: 'Mild and cloudy', indoorRecommended: false },
    '2026-06-29': { condition: 'rainy', temperature: 27, humidity: 92, rainChance: 80, description: 'Monsoon showers expected', indoorRecommended: true },
    '2026-06-30': { condition: 'sunny', temperature: 31, humidity: 70, rainChance: 10, description: 'Pleasant sunny day', indoorRecommended: false },
  };

  constructor(private userDnaService: UserDnaService) {}

  /** Main entry: generate AI day plan for a future date */
  generateDayPlan(dateStr: string): DayPlan {
    const date = new Date(dateStr + 'T00:00:00');
    const dow = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weather = this.weatherForecasts[dateStr] || this.getDefaultWeather();

    // Get patterns
    const weeklyPattern = this.userDnaService.getWeeklyPattern(dow);
    const patterns = this.userDnaService.detectPatterns();
    const comparison = this.userDnaService.getSameDayComparison(dateStr);

    // Build activities based on patterns + weather
    const activities = this.buildActivities(dateStr, dow, weather, patterns, weeklyPattern);

    const totalCost = activities.reduce((sum, a) => sum + a.estimatedCost, 0);
    const totalSavings = activities.reduce((sum, a) => {
      const bestAlt = a.alternatives.filter(alt => alt.weatherSuitable).sort((x, y) => x.estimatedCost - y.estimatedCost)[0];
      return sum + (bestAlt ? a.estimatedCost - bestAlt.estimatedCost : 0);
    }, 0);

    const patternScore = Math.round(activities.reduce((sum, a) => sum + a.confidence, 0) / Math.max(activities.length, 1));

    // Detected pattern labels
    const detectedPatterns: string[] = [];
    const coffeePat = patterns.find(p => p.subcategory === 'Coffee');
    if (coffeePat && coffeePat.streakCount >= 3) detectedPatterns.push(`☕ ${coffeePat.streakCount}-day coffee streak`);
    if (weeklyPattern.commonActivities.find(a => a.subcategory === 'Gym')) detectedPatterns.push('💪 Gym on ' + dayNames[dow] + 's');
    if (weeklyPattern.commonActivities.find(a => a.subcategory === 'Shopping' || a.subcategory === 'Groceries')) detectedPatterns.push('🛍️ Shopping pattern detected');

    // AI summary
    const aiSummary = this.generateSummary(dateStr, dow, weather, activities, comparison, detectedPatterns);

    return {
      date: dateStr,
      dayOfWeek: dow,
      dayName: dayNames[dow],
      weather,
      activities,
      totalEstimatedCost: Math.round(totalCost * 100) / 100,
      totalPotentialSavings: Math.round(totalSavings * 100) / 100,
      patternMatchScore: patternScore,
      aiSummary,
      weeklyTrend: {
        label: `vs last ${dayNames[dow]}`,
        trend: comparison.trend,
        percentage: Math.round(Math.abs((weeklyPattern.totalSpent - comparison.avgSpent) / Math.max(comparison.avgSpent, 1)) * 100)
      },
      detectedPatterns
    };
  }

  private buildActivities(
    dateStr: string, dow: number, weather: WeatherForecast,
    patterns: import('../models/transaction.model').SpendingPattern[],
    weeklyPattern: import('../models/transaction.model').WeeklyPattern
  ): PlannedActivity[] {
    const activities: PlannedActivity[] = [];
    const isWeekend = dow === 0 || dow === 6;
    const isRainy = weather.condition === 'rainy' || weather.condition === 'stormy';

    // ── MORNING: Coffee (strong daily pattern) ─────────────────
    const coffeePat = patterns.find(p => p.subcategory === 'Coffee');
    if (coffeePat) {
      const coffeeOptions = [
        { title: 'Iced Latte', merchant: 'Starbucks', cost: 2.50, icon: 'cafe', color: 'primary' },
        { title: 'Kopi-O Kosong', merchant: 'Toast Box', cost: 2.20, icon: 'cafe', color: 'warning' },
        { title: 'Cappuccino', merchant: 'PPP Coffee', cost: 2.80, icon: 'cafe', color: 'tertiary' },
        { title: 'Iced Americano', merchant: 'Huggs Coffee', cost: 2.50, icon: 'cafe', color: 'primary' },
      ];
      // Rotate based on day of week to show variety
      const coffee = coffeeOptions[dow % coffeeOptions.length];
      const weatherNote = isRainy ? 'Grab a hot drink since it\'s raining ☔' : 'Perfect weather for iced coffee ☀️';

      activities.push({
        id: `act-${dateStr}-morning`,
        time: '08:30',
        endTime: '09:00',
        category: 'Food & Beverage',
        subcategory: 'Coffee',
        title: coffee.title,
        description: `Your ${coffeePat.streakCount}-day coffee streak continues at ${coffee.merchant}!`,
        estimatedCost: coffee.cost,
        confidence: Math.min(coffeePat.confidence + 10, 98),
        reason: `You've had coffee every morning for ${coffeePat.streakCount} days straight. ${coffee.merchant} is your go-to on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]}s.`,
        patternSource: 'daily_streak',
        weatherNote,
        alternatives: [
          { title: 'Home Brew', description: 'Make your own coffee at home', estimatedCost: 0.80, savings: coffee.cost - 0.80, reason: 'Save money with home brew', weatherSuitable: true, distance: '0km' },
          { title: '7-Eleven Coffee', description: 'Quick convenience store coffee', estimatedCost: 1.50, savings: coffee.cost - 1.50, reason: 'Cheaper and faster', weatherSuitable: true, distance: '0.2km' },
        ],
        icon: coffee.icon,
        color: coffee.color
      });
    }

    // ── LATE MORNING: Weekend brunch or weekday skip ───────────
    if (isWeekend) {
      const brunchOptions = [
        { title: 'Eggs Benedict', place: 'Wild Honey', cost: 14.00, icon: 'restaurant', color: 'success' },
        { title: 'Avocado Toast', place: 'Group Therapy', cost: 14.00, icon: 'restaurant', color: 'success' },
        { title: 'Kaya Toast Set', place: 'Killiney', cost: 4.50, icon: 'restaurant', color: 'warning' },
      ];
      const brunch = brunchOptions[dow === 0 ? 1 : 2]; // Sun=Avocado, Sat=Kaya
      const wkPat = weeklyPattern.commonActivities.find(a => a.subcategory === 'Brunch' || a.subcategory === 'Breakfast');
      activities.push({
        id: `act-${dateStr}-brunch`,
        time: '10:30',
        endTime: '12:00',
        category: 'Food & Beverage',
        subcategory: 'Brunch',
        title: brunch.title,
        description: `Weekend brunch at ${brunch.place} — a ${['Sunday','Saturday'][dow === 0 ? 0 : 1]} tradition!`,
        estimatedCost: brunch.cost,
        confidence: wkPat ? wkPat.confidence : 65,
        reason: `You usually brunch out on ${['Sunday','Saturday'][dow === 0 ? 0 : 1]} mornings. ${brunch.place} matches your taste profile.`,
        patternSource: 'weekly_pattern',
        weatherNote: isRainy ? 'Indoor seating recommended due to rain' : 'Great patio weather!',
        alternatives: [
          { title: 'Home Cooked Brunch', description: 'Eggs and toast at home', estimatedCost: 3.00, savings: brunch.cost - 3.00, reason: 'Save and stay cozy', weatherSuitable: true, distance: '0km' },
          { title: 'Hawker Breakfast', description: 'Economical bee hoon or prata', estimatedCost: 3.50, savings: brunch.cost - 3.50, reason: 'Local flavors, local prices', weatherSuitable: true, distance: '0.3km' },
        ],
        icon: brunch.icon,
        color: brunch.color
      });
    }

    // ── LUNCH (weekday) ────────────────────────────────────────
    if (!isWeekend) {
      const lunchPatterns = weeklyPattern.commonActivities.filter(a => a.subcategory === 'Lunch');
      const lunchMap: Record<number, { title: string; place: string; cost: number }> = {
        1: { title: 'Chicken Rice', place: 'Kopitiam', cost: 5.50 },
        2: { title: 'Nasi Lemak', place: 'Punggol Nasi Lemak', cost: 6.00 },
        3: { title: 'Ban Mian', place: 'Qiu Lian', cost: 4.50 },
        4: { title: 'Chicken Rice', place: 'Kopitiam', cost: 5.50 },
        5: { title: 'Bak Kut Teh', place: 'Song Fa', cost: 6.50 },
      };
      const lunch = lunchMap[dow];
      if (lunch) {
        activities.push({
          id: `act-${dateStr}-lunch`,
          time: '12:00',
          endTime: '13:00',
          category: 'Food & Beverage',
          subcategory: 'Lunch',
          title: lunch.title,
          description: `Your regular ${lunch.title} fix at ${lunch.place}`,
          estimatedCost: lunch.cost,
          confidence: lunchPatterns.length > 0 ? lunchPatterns[0].confidence : 70,
          reason: `Every ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow]} you grab ${lunch.title} around noon.`,
          patternSource: 'weekly_pattern',
          alternatives: [
            { title: 'Cai Fan (Economical Rice)', description: '2 meat 1 veg at hawker', estimatedCost: 4.00, savings: lunch.cost - 4.00, reason: 'Cheaper and more variety', weatherSuitable: true, distance: '0.2km' },
            { title: 'Meal Prep from Home', description: 'Leftovers or packed lunch', estimatedCost: 2.00, savings: lunch.cost - 2.00, reason: 'Healthiest and cheapest option', weatherSuitable: true, distance: '0km' },
          ],
          icon: 'fast-food',
          color: 'success'
        });
      }
    }

    // ── AFTERNOON: Gym (Tue/Thu), Shopping (Wed), or Weekend activity ──
    if (dow === 2 || dow === 4) {
      // Gym day
      const gymWeatherNote = isRainy
        ? 'Good thing the gym is indoors! Stay dry while you work out 💪'
        : 'Sunny day — consider a run outdoors instead? ☀️';
      activities.push({
        id: `act-${dateStr}-afternoon`,
        time: '14:00',
        endTime: '16:00',
        category: 'Fitness',
        subcategory: 'Gym',
        title: 'Gym Session',
        description: 'ActiveSG Gym at Clementi Stadium — your Tuesday/Thursday ritual!',
        estimatedCost: 2.00,
        confidence: 92,
        reason: `You've been to the gym every ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} for 3 weeks running. Consistency is key!`,
        patternSource: 'weekly_pattern',
        weatherNote: gymWeatherNote,
        alternatives: [
          { title: 'Home Workout', description: 'YouTube HIIT session, no equipment', estimatedCost: 0, savings: 2.00, reason: 'Free and convenient', weatherSuitable: true, distance: '0km' },
          { title: 'Park Run', description: '5km loop around Clementi', estimatedCost: 0, savings: 2.00, reason: 'Fresh air + cardio', weatherSuitable: !isRainy, distance: '0.5km' },
          { title: 'ActiveSG Pool', description: 'Swim instead of gym', estimatedCost: 1.00, savings: 1.00, reason: 'Same venue, different workout', weatherSuitable: true, distance: '0km' },
        ],
        icon: 'barbell',
        color: 'tertiary'
      });
    } else if (dow === 3) {
      // Shopping Wednesday
      const shopWeatherNote = isRainy
        ? 'Perfect mall weather — shop indoors at JEM or Westgate!'
        : 'Sunny day — great for walking between malls';
      activities.push({
        id: `act-${dateStr}-afternoon`,
        time: '15:00',
        endTime: '17:00',
        category: 'Shopping',
        subcategory: 'Retail',
        title: 'Mid-week Shopping',
        description: 'Your Wednesday shopping routine — Uniqlo, Cotton On, or skincare restock',
        estimatedCost: 35.00,
        confidence: 78,
        reason: 'You tend to shop on Wednesdays. Past purchases: Uniqlo tees, Innisfree toner, Cotton On apparel.',
        patternSource: 'weekly_pattern',
        weatherNote: shopWeatherNote,
        alternatives: [
          { title: 'Online Window Shopping', description: 'Add to cart, sleep on it', estimatedCost: 0, savings: 35.00, reason: 'Avoid impulse buys', weatherSuitable: true, distance: '0km' },
          { title: 'Thrift Store Hunt', description: 'Refash or Lucky Plaza bargains', estimatedCost: 15.00, savings: 20.00, reason: 'Unique finds, lower cost', weatherSuitable: !isRainy, distance: '3km' },
        ],
        icon: 'bag',
        color: 'secondary'
      });
    } else if (isWeekend) {
      // Weekend afternoon activity
      const weekendActs = [
        { title: 'Botanic Gardens Walk', cat: 'Entertainment', sub: 'Park', cost: 0, icon: 'flower', color: 'success', indoor: false },
        { title: 'Escape Room Challenge', cat: 'Entertainment', sub: 'Escape Room', cost: 22, icon: 'lock-closed', color: 'tertiary', indoor: true },
        { title: 'Bowling with Friends', cat: 'Entertainment', sub: 'Bowling', cost: 18, icon: 'bowling-ball', color: 'primary', indoor: true },
        { title: 'ArtScience Museum', cat: 'Entertainment', sub: 'Museum', cost: 18, icon: 'color-palette', color: 'secondary', indoor: true },
      ];
      const wkAct = weekendActs[dow === 0 ? 3 : 1]; // Sun=Museum, Sat=Escape
      const suitable = isRainy ? wkAct.indoor : true;
      const weatherNote = isRainy && !wkAct.indoor
        ? '⚠️ Raining — switched to indoor alternative!'
        : isRainy && wkAct.indoor
        ? 'Rainy day = perfect for this indoor activity!'
        : 'Great weather for this! ☀️';

      activities.push({
        id: `act-${dateStr}-afternoon`,
        time: '14:00',
        endTime: '17:00',
        category: wkAct.cat,
        subcategory: wkAct.sub,
        title: wkAct.title,
        description: suitable
          ? `Your typical ${dow === 0 ? 'Sunday' : 'Saturday'} afternoon activity`
          : `Switched from outdoor plan due to ${weather.condition} — indoor fun instead!`,
        estimatedCost: wkAct.cost,
        confidence: 75,
        reason: `On ${dow === 0 ? 'Sundays' : 'Saturdays'} you usually do something fun in the afternoon. This matches your past spending.`,
        patternSource: suitable ? 'weekly_pattern' : 'weather_adapted',
        weatherNote,
        alternatives: [
          { title: 'Netflix Marathon', description: 'Stay home, chill', estimatedCost: 0, savings: wkAct.cost, reason: 'Zero cost, maximum comfort', weatherSuitable: true, distance: '0km' },
          { title: 'Library Study Session', description: 'Productive and free', estimatedCost: 0, savings: wkAct.cost, reason: 'Get ahead on assignments', weatherSuitable: true, distance: '0.4km' },
        ],
        icon: wkAct.icon,
        color: wkAct.color
      });
    } else if (dow === 5) {
      // Friday movie
      activities.push({
        id: `act-${dateStr}-evening`,
        time: '20:00',
        endTime: '22:30',
        category: 'Entertainment',
        subcategory: 'Movies',
        title: 'Movie Night',
        description: 'Friday night cinema — your weekly wind-down ritual',
        estimatedCost: 14.00,
        confidence: 85,
        reason: 'You\'ve watched movies on 2 of the last 3 Fridays. GV Jurong Point is your spot.',
        patternSource: 'weekly_pattern',
        weatherNote: isRainy ? 'Cozy indoor activity while it rains outside 🎬' : 'Air-conditioned comfort on a warm evening',
        alternatives: [
          { title: 'Netflix at Home', description: 'Stream from your couch', estimatedCost: 0, savings: 14.00, reason: 'Save the ticket + transport', weatherSuitable: true, distance: '0km' },
          { title: 'YouTube/Movie Marathon', description: 'Free entertainment', estimatedCost: 0, savings: 14.00, reason: 'Zero cost alternative', weatherSuitable: true, distance: '0km' },
        ],
        icon: 'film',
        color: 'primary'
      });
    } else if (dow === 1) {
      // Monday evening Netflix
      activities.push({
        id: `act-${dateStr}-evening`,
        time: '19:30',
        endTime: '22:00',
        category: 'Entertainment',
        subcategory: 'Streaming',
        title: 'Netflix & Chill',
        description: 'Monday night streaming — recover from the start of the week',
        estimatedCost: 0,
        confidence: 70,
        reason: 'You subscribed to Netflix and tend to watch on Monday evenings.',
        patternSource: 'weekly_pattern',
        weatherNote: 'Perfect for any weather!',
        alternatives: [
          { title: 'Read a Book', description: 'Use that Kinokuniya purchase', estimatedCost: 0, savings: 0, reason: 'Productive and free', weatherSuitable: true, distance: '0km' },
        ],
        icon: 'tv',
        color: 'danger'
      });
    }

    // ── DINNER ─────────────────────────────────────────────────
    const dinnerPatterns = weeklyPattern.commonActivities.filter(a => a.subcategory === 'Dinner');
    const dinnerMap: Record<number, { title: string; place: string; cost: number; icon: string; color: string }> = {
      0: { title: 'Pizza Night', place: 'Peperoni', cost: 16.00, icon: 'pizza', color: 'warning' },
      1: { title: 'Ramen Set', place: 'Ippudo', cost: 12.00, icon: 'bowl', color: 'primary' },
      2: { title: 'Fishball Noodles', place: 'Ah Hock', cost: 8.50, icon: 'fish', color: 'success' },
      3: { title: 'Korean BBQ', place: 'Seoul Yummy', cost: 22.00, icon: 'flame', color: 'danger' },
      4: { title: 'Pasta Aglio Olio', place: 'Saizeriya', cost: 7.00, icon: 'restaurant', color: 'tertiary' },
      5: { title: 'Movie Snacks + Dinner', place: 'Jurong Point', cost: 10.00, icon: 'fast-food', color: 'warning' },
      6: { title: 'K-BBQ Buffet', place: 'Seoul Garden', cost: 25.00, icon: 'flame', color: 'danger' },
    };
    const dinner = dinnerMap[dow];
    if (dinner) {
      const weatherDinnerNote = isRainy
        ? `Warm ${dinner.title.toLowerCase()} hits different on a rainy evening 🌧️`
        : `Enjoy ${dinner.title.toLowerCase()} al fresco or indoors`;

      activities.push({
        id: `act-${dateStr}-dinner`,
        time: '19:00',
        endTime: '20:30',
        category: 'Food & Beverage',
        subcategory: 'Dinner',
        title: dinner.title,
        description: `Your ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} night dinner spot`,
        estimatedCost: dinner.cost,
        confidence: dinnerPatterns.length > 0 ? dinnerPatterns[0].confidence : 68,
        reason: `You\'ve had ${dinner.title} on ${dow === 0 ? 'Sundays' : dow === 6 ? 'Saturdays' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow] + 's'} before. ${dinner.place} is a favorite.`,
        patternSource: 'weekly_pattern',
        weatherNote: weatherDinnerNote,
        alternatives: [
          { title: 'Cook at Home', description: 'Simple stir-fry or pasta', estimatedCost: 4.00, savings: dinner.cost - 4.00, reason: 'Healthier and way cheaper', weatherSuitable: true, distance: '0km' },
          { title: 'Hawker Dinner', description: 'Cai fan or mixed rice', estimatedCost: 5.00, savings: dinner.cost - 5.00, reason: 'Local, fast, affordable', weatherSuitable: true, distance: '0.3km' },
        ],
        icon: dinner.icon,
        color: dinner.color
      });
    }

    // ── EVENING (weekend only, if not already added) ───────────
    if (isWeekend && !activities.find(a => a.time.startsWith('20'))) {
      activities.push({
        id: `act-${dateStr}-evening`,
        time: '20:00',
        endTime: '23:00',
        category: 'Entertainment',
        subcategory: 'Night Out',
        title: dow === 6 ? 'Saturday Night Out' : 'Sunday Wind Down',
        description: dow === 6 ? 'Zouk or Clarke Quay with friends' : 'Early night to prep for the week',
        estimatedCost: dow === 6 ? 35.00 : 0,
        confidence: 60,
        reason: dow === 6 ? 'You tend to go out on Saturday nights' : 'You usually rest early on Sundays',
        patternSource: 'weekly_pattern',
        weatherNote: isRainy && dow === 6 ? 'Clubs are indoors — rain won\'t stop the party!' : 'Any weather works for this',
        alternatives: [
          { title: 'Board Games at Home', description: 'Invite friends over', estimatedCost: 5.00, savings: 30.00, reason: 'Fun without the cover charge', weatherSuitable: true, distance: '0km' },
          { title: 'Late Night Supper', description: 'Supper at Swee Choon or prata', estimatedCost: 8.00, savings: 27.00, reason: 'Cheaper night out vibe', weatherSuitable: true, distance: '2km' },
        ],
        icon: dow === 6 ? 'musical-notes' : 'bed',
        color: dow === 6 ? 'secondary' : 'medium'
      });
    }

    // Sort by time
    return activities.sort((a, b) => a.time.localeCompare(b.time));
  }

  private generateSummary(
    dateStr: string, dow: number, weather: WeatherForecast,
    activities: PlannedActivity[],
    comparison: { sameDayLastWeek: string; avgSpent: number; trend: 'up' | 'down' | 'stable' },
    detectedPatterns: string[]
  ): string {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
    const totalCost = activities.reduce((s, a) => s + a.estimatedCost, 0);
    const patternCount = detectedPatterns.length;

    let summary = `Good morning! It's ${dayName}, ${dateStr}. `;

    if (weather.condition === 'rainy' || weather.condition === 'stormy') {
      summary += `It's ${weather.description.toLowerCase()} today, so I've adjusted your plan toward indoor activities. `;
    } else if (weather.condition === 'sunny' && weather.temperature > 32) {
      summary += `It's going to be a scorcher at ${weather.temperature}°C! I've kept you near air-conditioned spots. `;
    } else {
      summary += `Weather looks great — ${weather.description.toLowerCase()}. `;
    }

    if (patternCount >= 2) {
      summary += `I spotted ${patternCount} strong patterns in your history. `;
    }

    const highConf = activities.filter(a => a.confidence >= 85);
    if (highConf.length > 0) {
      summary += `I'm ${highConf[0].confidence}% confident you'll ${highConf[0].title.toLowerCase()} at ${highConf[0].time}. `;
    }

    if (comparison.trend === 'up') {
      summary += `You typically spend more on ${dayName}s compared to last week. Today's estimate: $${totalCost.toFixed(2)}.`;
    } else if (comparison.trend === 'down') {
      summary += `You're on track to spend less than your usual ${dayName}. Great job keeping it lean!`;
    } else {
      summary += `Spending pattern is stable vs. previous weeks. Estimated total: $${totalCost.toFixed(2)}.`;
    }

    return summary;
  }

  private getDefaultWeather(): WeatherForecast {
    return {
      condition: 'cloudy',
      temperature: 29,
      humidity: 75,
      rainChance: 30,
      description: 'Partly cloudy, typical Singapore day',
      indoorRecommended: false
    };
  }
}
