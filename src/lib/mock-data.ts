export interface SearchResult {
  id: string
  imageUrl: string
  sourceUrl: string
  sourceName: string
  title: string
  matchScore: number
  category: "social" | "scammer" | "news" | "mugshot" | "video"
  thumbnailUrl: string
  description?: string
  foundAt: string
}

export interface CreditPackage { id: string; credits: number; price: number; popular?: boolean; discount?: number }

export const MOCK_RESULTS: SearchResult[] = [
  { id:"1", imageUrl:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://instagram.com/p/abc123", sourceName:"Instagram", title:"Profile photo — j.doe.1987", matchScore:94, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", foundAt:"2024-03-15" },
  { id:"2", imageUrl:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://linkedin.com/in/johndoe", sourceName:"LinkedIn", title:"John Doe — Software Engineer at TechCorp", matchScore:91, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", description:"LinkedIn profile — Software Engineer at TechCorp (2020-Present)", foundAt:"2024-05-20" },
  { id:"3", imageUrl:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://facebook.com/john.doe.5", sourceName:"Facebook", title:"John Doe — Profile Pictures Album", matchScore:88, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", description:"Public Facebook profile with 847 friends · Joined 2012", foundAt:"2024-01-10" },
  { id:"4", imageUrl:"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://tiktok.com/@johndoe", sourceName:"TikTok", title:"@johndoe — 142.3K followers", matchScore:85, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face", foundAt:"2024-06-01" },
  { id:"5", imageUrl:"https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://newsdaily.com/scam-alert-2024", sourceName:"News Daily", title:"Local authorities warn of online romance scam ring", matchScore:79, category:"scammer", thumbnailUrl:"https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face", description:"News article featuring this person in connection with a romance scam investigation", foundAt:"2024-04-22" },
  { id:"6", imageUrl:"https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://youtube.com/watch?v=ex123", sourceName:"YouTube", title:"Conference Talk at DevConf 2024 — Full Recording", matchScore:76, category:"video", thumbnailUrl:"https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face", foundAt:"2024-07-03" },
  { id:"7", imageUrl:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://twitter.com/johndoe", sourceName:"X (Twitter)", title:"@johndoe · Joined December 2019", matchScore:72, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face", description:"2,847 Following · 3,129 Followers · 541 posts", foundAt:"2024-02-14" },
  { id:"8", imageUrl:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://citygazette.com/community-volunteer", sourceName:"City Gazette", title:"Community Volunteer Recognition Ceremony 2023", matchScore:68, category:"news", thumbnailUrl:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face", description:"Photo from the annual community volunteer awards ceremony", foundAt:"2023-12-05" },
  { id:"9", imageUrl:"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://instagram.com/reel/ex456", sourceName:"Instagram", title:"Beach vacation — Reel with 2.1M views", matchScore:65, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face", foundAt:"2024-05-30" },
  { id:"10", imageUrl:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://publicrecords.state.us/case/2023-0042", sourceName:"Public Records", title:"State of California — Public Record #2023-0042", matchScore:55, category:"mugshot", thumbnailUrl:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face", description:"Publicly available court record photograph", foundAt:"2023-08-12" },
  { id:"11", imageUrl:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://pinterest.com/pin/ex789", sourceName:"Pinterest", title:"Pinned to 'Fashion Inspo' board · 2.3K saves", matchScore:58, category:"social", thumbnailUrl:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", foundAt:"2024-01-25" },
  { id:"12", imageUrl:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", sourceUrl:"https://news-site.com/breaking-news", sourceName:"Breaking News Network", title:"Person of interest in downtown incident — CCTV footage", matchScore:52, category:"news", thumbnailUrl:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face", description:"Security camera footage released by local police department", foundAt:"2024-04-18" },
]

export const STATS = [
  { value: "1,436,956,062", label: "Faces Online" },
  { value: "850M+", label: "Social Profiles" },
  { value: "2.5M+", label: "Searches Daily" },
  { value: "99.7%", label: "Accuracy Rate" },
]
