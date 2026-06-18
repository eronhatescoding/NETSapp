import { Injectable } from '@angular/core';
import { Event, Activity } from '../models/explore.model';

@Injectable({ providedIn: 'root' })
export class ExploreDataService {

  private events: Event[] = [
    {
      id: 'e1', title: 'NMIXX CHANGE UP : MIXX LAB', category: 'Concert',
      date: '28 June 2026', venue: 'Singapore Indoor Stadium',
      description: 'K-pop girl group NMIXX brings their explosive energy to Singapore for the first time! Expect high-octane performances of "Love Me Like This" and "DASH".',
      price: 168, tags: ['K-pop', 'Live Music', 'Dance'], isFeatured: false
    },
    {
      id: 'e2', title: 'The Kid LAROI: The First Time Tour', category: 'Concert',
      date: '5 July 2026', venue: 'Star Theatre',
      description: 'Australian pop sensation The Kid LAROI performs hits from his debut album including "Stay" and "Without You".',
      price: 128, tags: ['Pop', 'Hip-Hop', 'Live Music'], isFeatured: false
    },
    {
      id: 'e3', title: 'IRENE: Like A Flower Fanmeet', category: 'Fanmeet',
      date: '12 July 2026', venue: 'The Star Performing Arts Centre',
      description: 'Red Velvet\'s IRENE hosts an intimate fanmeet with games, performances, and Q&A sessions with lucky fans.',
      price: 188, tags: ['K-pop', 'Fanmeet', 'Red Velvet'], isFeatured: false
    },
    {
      id: 'e4', title: 'EXO PLANET #6: EXhOrizon', category: 'Concert',
      date: '24-26 July 2026', venue: 'Singapore Indoor Stadium',
      description: 'EXO returns to Singapore for a 3-night spectacular! All 8 members performing their greatest hits plus new tracks from EXIST.',
      price: 298, tags: ['K-pop', 'Sold Out', 'Legendary'], isFeatured: true
    },
    {
      id: 'e5', title: 'Singapore International Piano Festival', category: 'Classical',
      date: '18-20 July 2026', venue: 'Esplanade Concert Hall',
      description: 'World-class pianists perform Rachmaninoff, Chopin, and contemporary works over three evenings.',
      price: 65, tags: ['Classical', 'Piano', 'Esplanade'], isFeatured: false
    },
    {
      id: 'e6', title: 'Broadway Beng: The Musical', category: 'Theatre',
      date: '8-15 Aug 2026', venue: 'Victoria Theatre',
      description: 'Hilarious Hokkien-English musical comedy starring Sebastian Tan. A Singapore classic returns!',
      price: 55, tags: ['Comedy', 'Musical', 'Local'], isFeatured: false
    },
    {
      id: 'e7', title: 'Singapore Food Festival 2026', category: 'Festival',
      date: '1-31 July 2026', venue: 'Various Locations',
      description: 'Month-long celebration of Singapore\'s hawker culture with special menus, food tours, and chef collaborations.',
      price: 0, tags: ['Food', 'Festival', 'Free Entry'], isFeatured: false
    },
    {
      id: 'e8', title: 'Future World: ArtScience Museum', category: 'Exhibition',
      date: 'Ongoing', venue: 'Marina Bay Sands',
      description: 'Immersive digital art installation by teamLab. Walk through waterfalls of light and interactive gardens.',
      price: 18, tags: ['Art', 'Digital', 'Interactive'], isFeatured: false
    }
  ];

  private activities: Activity[] = [
    {
      id: 'a1', title: 'PPP Coffee Roasters Workshop', category: 'Workshop',
      description: 'Learn latte art and coffee brewing from champion baristas. Perfect for your coffee obsession!',
      location: 'Star Vista', distance: '0.8km', estimatedCost: 45,
      tasteMatch: 94, tags: ['Coffee', 'Workshop', 'Hands-on'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'morning'
    },
    {
      id: 'a2', title: 'ActiveSG Gym Pass (Monthly)', category: 'Fitness',
      description: 'Unlimited gym access at Clementi Stadium. Your Tuesday/Thursday ritual spot.',
      location: 'Clementi Stadium', distance: '0.5km', estimatedCost: 25,
      tasteMatch: 91, tags: ['Gym', 'Fitness', 'Routine'],
      weatherSuitable: ['any', 'sunny', 'rainy', 'cloudy'], isIndoor: true, timeOfDay: 'afternoon'
    },
    {
      id: 'a3', title: 'Ramen Food Tour: Clementi to Jurong', category: 'Food Tour',
      description: 'Guided walking tour of the best ramen spots from Clementi to Jurong East. Includes 4 tastings!',
      location: 'Clementi → Jurong', distance: '3km', estimatedCost: 35,
      tasteMatch: 88, tags: ['Ramen', 'Food Tour', 'Walking'],
      weatherSuitable: ['sunny', 'cloudy'], isIndoor: false, timeOfDay: 'afternoon'
    },
    {
      id: 'a4', title: 'Hawker Heritage Walk', category: 'Cultural',
      description: 'Guided tour of Clementi 448 Market with tastings of chicken rice, nasi lemak, and ban mian.',
      location: 'Clementi 448', distance: '0.3km', estimatedCost: 15,
      tasteMatch: 95, tags: ['Hawker', 'Local', 'Food'],
      weatherSuitable: ['sunny', 'cloudy', 'any'], isIndoor: false, timeOfDay: 'morning'
    },
    {
      id: 'a5', title: 'Clementi Park Cycling Loop', category: 'Outdoor',
      description: 'Scenic 10km cycling route around Clementi Park and Ulu Pandan. Bike rental included.',
      location: 'Clementi Park', distance: '1.2km', estimatedCost: 12,
      tasteMatch: 72, tags: ['Cycling', 'Nature', 'Exercise'],
      weatherSuitable: ['sunny', 'cloudy'], isIndoor: false, timeOfDay: 'morning'
    },
    {
      id: 'a6', title: 'Seoul Yummy K-BBQ Experience', category: 'Dining',
      description: 'All-you-can-eat Korean BBQ with banchan buffet. Your Wednesday dinner favorite!',
      location: 'JEM', distance: '2.5km', estimatedCost: 28,
      tasteMatch: 89, tags: ['Korean', 'BBQ', 'Buffet'],
      weatherSuitable: ['any', 'sunny', 'rainy', 'cloudy'], isIndoor: true, timeOfDay: 'evening'
    },
    {
      id: 'a7', title: 'Zouk Singapore: Saturday Night', category: 'Nightlife',
      description: 'Asia\'s iconic nightclub. Saturday night entry with 2 drinks included.',
      location: 'Clarke Quay', distance: '6km', estimatedCost: 45,
      tasteMatch: 68, tags: ['Clubbing', 'Nightlife', 'Music'],
      weatherSuitable: ['any', 'sunny', 'rainy', 'cloudy'], isIndoor: true, timeOfDay: 'evening'
    },
    {
      id: 'a8', title: 'Cooking Class: Hawker Favorites', category: 'Workshop',
      description: 'Learn to cook chicken rice, nasi lemak, and fishball noodles from a hawker uncle!',
      location: 'Palate Sensations', distance: '4km', estimatedCost: 65,
      tasteMatch: 82, tags: ['Cooking', 'Hawker', 'Skills'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'afternoon'
    },
    {
      id: 'a9', title: 'NUS Library Study Session', category: 'Study',
      description: 'Quiet study spot at Central Library with cafe access. Perfect for exam season.',
      location: 'NUS Kent Ridge', distance: '1.5km', estimatedCost: 5,
      tasteMatch: 76, tags: ['Study', 'Quiet', 'Productive'],
      weatherSuitable: ['any', 'sunny', 'rainy', 'cloudy'], isIndoor: true, timeOfDay: 'any'
    },
    {
      id: 'a10', title: 'Trapped Escape Room: The Haunting', category: 'Entertainment',
      description: 'Horror-themed escape room at Bugis. 60 minutes to solve the mystery and escape!',
      location: 'Bugis', distance: '5km', estimatedCost: 25,
      tasteMatch: 71, tags: ['Escape Room', 'Thriller', 'Team'],
      weatherSuitable: ['any'], isIndoor: true, timeOfDay: 'afternoon'
    },
    {
      id: 'a11', title: 'Botanic Gardens Morning Walk', category: 'Nature',
      description: 'Guided nature walk through UNESCO World Heritage Site. Free entry, paid tour.',
      location: 'Botanic Gardens', distance: '3km', estimatedCost: 8,
      tasteMatch: 85, tags: ['Nature', 'Walking', 'Free'],
      weatherSuitable: ['sunny', 'cloudy'], isIndoor: false, timeOfDay: 'morning'
    },
    {
      id: 'a12', title: 'Toast Box: Kopi & Kaya Loyalty', category: 'Food',
      description: 'Your Tuesday morning spot! Collect stamps for a free kaya toast set on your 10th visit.',
      location: 'Clementi Mall', distance: '0.4km', estimatedCost: 4.50,
      tasteMatch: 93, tags: ['Breakfast', 'Local', 'Loyalty'],
      weatherSuitable: ['any', 'sunny', 'rainy', 'cloudy'], isIndoor: true, timeOfDay: 'morning'
    }
  ];

  getEvents(): Event[] { return [...this.events]; }
  getActivities(): Activity[] { return [...this.activities]; }

  getActivityById(id: string): Activity | undefined {
    return this.activities.find(a => a.id === id);
  }

  getTasteColor(match: number): string {
    if (match >= 85) return 'success';
    if (match >= 70) return 'primary';
    if (match >= 55) return 'warning';
    return 'medium';
  }

  getTasteMatchReason(activity: Activity): string {
    const reasons: Record<string, string> = {
      'a1': 'You buy coffee almost every day. This workshop matches your daily ritual perfectly.',
      'a2': 'You visit the gym every Tuesday and Thursday. A monthly pass saves you $3 per visit!',
      'a3': 'You\'ve spent $35 on ramen in the past 2 weeks. This tour covers 4 top spots.',
      'a4': 'Your transaction history shows 5+ hawker visits weekly. This walk hits all your favorites.',
      'a5': 'You enjoy outdoor activities on sunny weekends. Cycling is a great low-cost option.',
      'a6': 'Korean BBQ is your Wednesday dinner pattern. This buffet matches your spending habit.',
      'a7': 'You go out on Saturday nights. Zouk is the iconic Singapore clubbing experience.',
      'a8': 'You eat hawker food daily. Learning to cook it saves money long-term.',
      'a9': 'You bought textbooks and study supplies. NUS library is perfect for focused work.',
      'a10': 'You did an escape room on June 13. This new room theme keeps the excitement going.',
      'a11': 'You walked Botanic Gardens on June 7. A guided tour adds depth to your visit.',
      'a12': 'Toast Box appears in your history every Tuesday. The loyalty program rewards your habit.',
    };
    return reasons[activity.id] || 'This activity aligns with your general spending patterns.';
  }
}
