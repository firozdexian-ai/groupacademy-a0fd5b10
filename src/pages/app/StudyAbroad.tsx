import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, MapPin, Calendar, DollarSign, ArrowLeft, Search, Filter, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const COUNTRIES = [
  { name: 'All Countries', code: 'all', flag: '🌍' },
  { name: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
];

const DEGREE_TYPES = ['All Degrees', 'Bachelor', 'Master', 'PhD', 'Diploma'];

export default function StudyAbroad() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('All Degrees');

  const { data: programs, isLoading } = useQuery({
    queryKey: ['study-abroad-programs', selectedCountry, selectedDegree, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('study_abroad_programs')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('university_name');

      if (selectedCountry !== 'all') {
        query = query.eq('country_code', selectedCountry);
      }
      if (selectedDegree !== 'All Degrees') {
        query = query.eq('degree_type', selectedDegree);
      }
      if (searchTerm) {
        query = query.or(`university_name.ilike.%${searchTerm}%,program_name.ilike.%${searchTerm}%,field_of_study.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const countryData = COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/abroad')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Study Abroad</h1>
          <p className="text-muted-foreground">Explore universities and programs worldwide</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities, programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(country => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDegree} onValueChange={setSelectedDegree}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Degree type" />
          </SelectTrigger>
          <SelectContent>
            {DEGREE_TYPES.map(degree => (
              <SelectItem key={degree} value={degree}>{degree}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
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
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/abroad/study/${program.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {COUNTRIES.find(c => c.code === program.country_code)?.flag || '🌍'}
                    </span>
                    <div>
                      <CardTitle className="text-base">{program.university_name}</CardTitle>
                      <CardDescription>{program.country_name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {program.featured && (
                      <Badge className="bg-primary/10 text-primary">Featured</Badge>
                    )}
                    {program.scholarship_available && (
                      <Badge variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        Scholarship
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-2">{program.program_name}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {program.degree_type && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {program.degree_type}
                    </span>
                  )}
                  {program.duration && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {program.duration}
                    </span>
                  )}
                  {program.tuition_range && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {program.tuition_range}
                    </span>
                  )}
                </div>
                {program.field_of_study && (
                  <Badge variant="outline" className="mt-3">{program.field_of_study}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCountry !== 'all' || selectedDegree !== 'All Degrees'
                ? 'Try adjusting your filters to find more programs.'
                : 'Programs will be added soon. Check back later!'}
            </p>
            {(searchTerm || selectedCountry !== 'all' || selectedDegree !== 'All Degrees') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCountry('all');
                  setSelectedDegree('All Degrees');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
