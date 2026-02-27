import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Coins, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({
  talentName,
  talentPhoto,
  talentProfession,
  onRefresh,
  isRefreshing
}: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const initials = talentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    const fetchHeroBanner = async () => {
      const { data } = await supabase
        .from('banners')
        .select('image_url')
        .eq('is_active', true)
        .eq('placement', 'hero')
        .order('display_order')
        .limit(1);
      if (data && data.length > 0) {
        setHeroBannerUrl(data[0].image_url);
      }
    };
    fetchHeroBanner();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl shadow-sm aspect-[3/1]">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0"
        style={
          heroBannerUrl
            ? { backgroundImage: `url('${heroBannerUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)' }
        }
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-0" />

      {/* Content - Left-Aligned Horizontal */}
      <div className="relative z-10 flex items-center h-full text-white px-5 gap-3">
        <Avatar
          className="h-14 w-14 ring-[3px] ring-white/40 shadow-lg cursor-pointer shrink-0"
          onClick={() => navigate('/app/profile')}
        >
          <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
          <AvatarFallback className="bg-white/20 text-white font-bold text-base">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="font-bold text-base leading-tight truncate">
            {talentName || 'Welcome'}
          </h1>
          {talentProfession && (
            <p className="text-white/70 text-xs leading-tight truncate">
              {talentProfession}
            </p>
          )}
        </div>

        <Badge
          className="gap-1 bg-white/20 backdrop-blur-sm text-white border-white/30 text-[10px] h-6 shrink-0 cursor-pointer select-none"
          onClick={() => setShowCredits(prev => !prev)}
        >
          {showCredits ? <Coins className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span className="font-bold">{showCredits ? balance : '••••'}</span>
        </Badge>
      </div>
    </div>
  );
}
