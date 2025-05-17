'use client';

import { startTransition, use, useActionState, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { updateAccount } from '@/app/login/actions';
import { Combobox } from '@/components/ui/combobox';
import { countries, popularCities } from '@/lib/geo-data';

type ActionState = {
  error?: string;
  success?: string;
};

export default function GeneralPage() {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    { error: '', success: '' }
  );
  const [birthCity, setBirthCity] = useState(user?.birthCity || '');
  const [birthCountry, setBirthCountry] = useState(user?.birthCountry || '');

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      console.log("User data:", user);
      console.log("Birth time:", user.birthTime, "type:", typeof user.birthTime);
      console.log("Birth city:", user.birthCity);
      console.log("Birth country:", user.birthCountry);
      
      if (user.birthCity) setBirthCity(user.birthCity);
      if (user.birthCountry) setBirthCountry(user.birthCountry);
    }
  }, [user]);

  // Convert date format
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return '';
    try {
      // Ensure proper format YYYY-MM-DD for input[type="date"]
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Format time for display in the form
  const formatTime = (time: string | Date | undefined | null) => {
    if (!time) return '';
    // If time is already a string (which it should be in the DB), return it directly
    if (typeof time === 'string') {
      return time;
    }
    // For backward compatibility - if it's somehow a Date object
    try {
      return new Date(time).toTimeString().split(' ')[0].substring(0, 5);
    } catch (e) {
      return '';
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTransition.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      formAction(new FormData(event.currentTarget));
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        General Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="mb-2">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                defaultValue={user?.name || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={user?.email || ''}
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-md font-medium text-gray-800 mb-3">Birth Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate" className="mb-2">
                    Birth Date
                  </Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={formatDate(user?.birthDate)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthTime" className="mb-2">
                    Birth Time
                  </Label>
                  <Input
                    id="birthTime"
                    name="birthTime"
                    type="time"
                    defaultValue={formatTime(user?.birthTime)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="birthCity" className="mb-2">
                    Birth City
                  </Label>
                  <Input
                    id="birthCity"
                    name="birthCity"
                    type="text"
                    list="cityOptions"
                    placeholder="Select birth city"
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <datalist id="cityOptions">
                    {popularCities.map((city) => (
                      <option key={city.value} value={city.label} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <Label htmlFor="birthCountry" className="mb-2">
                    Birth Country
                  </Label>
                  <Input
                    id="birthCountry"
                    name="birthCountry"
                    type="text"
                    list="countryOptions"
                    placeholder="Select birth country"
                    value={birthCountry}
                    onChange={(e) => setBirthCountry(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <datalist id="countryOptions">
                    {countries.map((country) => (
                      <option key={country.value} value={country.label} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
            
            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && (
              <p className="text-green-500 text-sm">{state.success}</p>
            )}
            <Button
              type="submit"
              className="rounded-lg px-5 text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shadow-md"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
