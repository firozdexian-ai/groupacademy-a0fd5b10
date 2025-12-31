import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Calendar, Users, ArrowLeft, ArrowRight, Clock, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  upcoming: { label: 'Upcoming', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  judging: { label: 'Judging', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function Competitions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions', filter],
    queryFn: async () => {
      let query = supabase
        .from('competitions')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/learning')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Competitions</h1>
          <p className="text-muted-foreground">Showcase your skills and win prizes</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Competitions List */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : competitions && competitions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {competitions.map((competition) => {
            const statusConfig = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
            const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];
            
            return (
              <Card 
                key={competition.id}
                className={`hover:shadow-lg transition-all cursor-pointer ${competition.is_featured ? 'ring-2 ring-primary/50' : ''}`}
                onClick={() => navigate(`/app/learning/competitions/${competition.slug}`)}
              >
                {competition.featured_image && (
                  <div className="h-40 overflow-hidden rounded-t-lg">
                    <img 
                      src={competition.featured_image} 
                      alt={competition.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className={competition.featured_image ? 'pt-4' : ''}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {competition.is_featured && (
                          <Badge className="bg-primary/10 text-primary">Featured</Badge>
                        )}
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>
                      <CardTitle className="text-lg">{competition.title}</CardTitle>
                      {competition.category && (
                        <CardDescription>{competition.category}</CardDescription>
                      )}
                    </div>
                    <Trophy className="h-6 w-6 text-warning flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  {competition.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {competition.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                    {competition.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(competition.start_date), 'MMM d')}
                        {competition.end_date && ` - ${format(new Date(competition.end_date), 'MMM d, yyyy')}`}
                      </span>
                    )}
                    {competition.max_participants && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Max {competition.max_participants}
                      </span>
                    )}
                  </div>

                  {competition.submission_deadline && competition.status === 'active' && (
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="font-medium text-warning">
                        {getTimeRemaining(competition.submission_deadline)}
                      </span>
                    </div>
                  )}

                  {prizes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {prizes.length} {prizes.length === 1 ? 'Prize' : 'Prizes'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Competitions Found</h3>
            <p className="text-muted-foreground mb-4">
              {filter !== 'all' 
                ? `No ${filter} competitions at the moment. Check back later!`
                : 'Competitions will be announced soon. Stay tuned!'}
            </p>
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View All Competitions
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
