import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Shield } from 'lucide-react';

// Phone validation schema
const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Please select a country code'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\d+$/, 'Phone number can only contain digits'),
});

// OTP validation schema  
const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP can only contain digits'),
});

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export default function LoginForm() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneData, setPhoneData] = useState<{ phone: string; countryCode: string } | null>(null);
  
  const { sendOtp, verifyOtp, isLoading, otpSent } = useAuthStore();
  const { toast } = useToast();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: '',
      phone: '',
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2');
        const data = await response.json();
        
        const formattedCountries = data
          .filter((country: any) => country.idd?.root && country.idd?.suffixes?.length > 0)
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2,
            dialCode: `${country.idd.root}${country.idd.suffixes[0]}`,
            flag: country.flag,
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(formattedCountries);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        toast({
          title: "Error",
          description: "Failed to load country codes. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    fetchCountries();
  }, [toast]);

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    try {
      const success = await sendOtp(data.phone, data.countryCode);
      if (success) {
        setPhoneData(data);
        setStep('otp');
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${data.countryCode} ${data.phone}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    try {
      const success = await verifyOtp(data.otp);
      if (success) {
        toast({
          title: "Welcome!",
          description: "You have been successfully logged in.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please check your code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resendOtp = async () => {
    if (!phoneData) return;
    
    try {
      const success = await sendOtp(phoneData.phone, phoneData.countryCode);
      if (success) {
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto glass animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Gemini Chat</CardTitle>
          <CardDescription>
            Enter your phone number to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">Country</Label>
              <Select 
                value={phoneForm.watch('countryCode')} 
                onValueChange={(value) => phoneForm.setValue('countryCode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.dialCode}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                        <span className="text-muted-foreground">({country.dialCode})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {phoneForm.formState.errors.countryCode && (
                <p className="text-sm text-destructive">
                  {phoneForm.formState.errors.countryCode.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="w-20 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                  {phoneForm.watch('countryCode') || '+1'}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  {...phoneForm.register('phone')}
                  className="flex-1"
                />
              </div>
              {phoneForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {phoneForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="gradient"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto glass animate-fade-in">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 gradient-secondary rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{' '}
          <span className="font-medium">
            {phoneData?.countryCode} {phoneData?.phone}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
              {...otpForm.register('otp')}
              autoFocus
            />
            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            variant="gradient"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={resendOtp}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Didn't receive the code? Resend
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('phone')}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Change phone number
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}