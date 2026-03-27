import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { BUSINESS_PRESETS, MODULE_LABELS, type BusinessTypePreset } from '@/constants/modules'
import {
  UtensilsCrossed, ShoppingCart, Pill, Truck, Shirt, Monitor, Settings,
  ArrowRight, ArrowLeft, Check, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

const iconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="w-8 h-8" />,
  ShoppingCart: <ShoppingCart className="w-8 h-8" />,
  Pill: <Pill className="w-8 h-8" />,
  Truck: <Truck className="w-8 h-8" />,
  Shirt: <Shirt className="w-8 h-8" />,
  Monitor: <Monitor className="w-8 h-8" />,
  Settings: <Settings className="w-8 h-8" />
}

const businessInfoSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  currency_symbol: z.string().default('Rs.'),
  currency_code: z.string().default('PKR')
})

const ownerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type BusinessInfoForm = z.infer<typeof businessInfoSchema>
type OwnerForm = z.infer<typeof ownerSchema>

const STEPS = ['Welcome', 'Business Type', 'Business Info', 'Owner Account', 'Modules', 'Done']

export default function SetupWizard() {
  const navigate = useNavigate()
  const { loadProfile } = useProfileStore()
  const { login } = useAuthStore()

  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<BusinessTypePreset | null>(null)
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const businessForm = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: { currency_symbol: 'Rs.', currency_code: 'PKR' }
  })

  const ownerForm = useForm<OwnerForm>({
    resolver: zodResolver(ownerSchema)
  })

  const handleSelectType = (preset: BusinessTypePreset) => {
    setSelectedType(preset)
    setActiveModules([...preset.modules])
  }

  const toggleModule = (mod: string) => {
    // Dashboard, settings, backup always on
    if (['dashboard', 'settings', 'backup'].includes(mod)) return
    setActiveModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    )
  }

  const handleFinish = async () => {
    if (!selectedType) return

    setSaving(true)
    try {
      const businessData = businessForm.getValues()
      const ownerData = ownerForm.getValues()

      // Create business profile
      await window.api.invoke('profile:create', {
        name: businessData.name,
        type: selectedType.key,
        address: businessData.address || null,
        phone: businessData.phone || null,
        email: businessData.email || null,
        currency_symbol: businessData.currency_symbol,
        currency_code: businessData.currency_code,
        active_modules: JSON.stringify(activeModules),
        custom_labels: JSON.stringify(selectedType.customLabels)
      })

      // Create owner account
      await window.api.invoke('users:create', {
        name: ownerData.name,
        username: ownerData.username,
        password: ownerData.password,
        role: 'owner'
      })

      // Load profile and login
      await loadProfile()
      await login(ownerData.username, ownerData.password)

      setStep(5) // Done step
    } catch (error: unknown) {
      toast.error('Setup failed: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return selectedType !== null
      case 2: return businessForm.formState.isValid
      case 3: return ownerForm.formState.isValid
      default: return true
    }
  }

  const handleNext = async () => {
    if (step === 2) {
      const valid = await businessForm.trigger()
      if (!valid) return
    }
    if (step === 3) {
      const valid = await ownerForm.trigger()
      if (!valid) return
    }
    if (step === 4) {
      handleFinish()
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Progress bar */}
      {step < 5 && (
        <div className="flex items-center justify-center gap-2 pt-6 px-8">
          {STEPS.slice(0, -1).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                i < step ? 'bg-primary text-white' :
                i === step ? 'bg-primary text-white ring-4 ring-primary/30' :
                'bg-slate-700 text-slate-400'
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div className={cn('w-12 h-0.5', i < step ? 'bg-primary' : 'bg-slate-700')} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-2xl">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary mx-auto flex items-center justify-center mb-6">
                <span className="text-white font-heading font-bold text-3xl">B</span>
              </div>
              <h1 className="text-4xl font-heading font-bold text-white mb-3">Welcome to BizCore</h1>
              <p className="text-slate-400 text-lg mb-2">One app. Every business.</p>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Let&apos;s set up your business in just a few steps. This will only take a minute.
              </p>
              <Button size="lg" onClick={() => setStep(1)} icon={<ArrowRight className="w-5 h-5" />}>
                Get Started
              </Button>
            </div>
          )}

          {/* Step 1: Business Type */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-heading font-bold text-white mb-2 text-center">
                What type of business do you run?
              </h2>
              <p className="text-slate-400 text-center mb-8">
                This determines which features and labels are enabled by default.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handleSelectType(preset)}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                      selectedType?.key === preset.key
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    )}
                  >
                    <div className={cn(
                      'p-2.5 rounded-lg flex-shrink-0',
                      selectedType?.key === preset.key ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'
                    )}>
                      {iconMap[preset.icon]}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{preset.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-heading font-bold text-txt-primary mb-6">Business Information</h2>
              <div className="space-y-4">
                <Input label="Business Name" placeholder="e.g. Ali General Store" error={businessForm.formState.errors.name?.message} {...businessForm.register('name')} />
                <Input label="Address" placeholder="Street, City" {...businessForm.register('address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" placeholder="+92 300 1234567" {...businessForm.register('phone')} />
                  <Input label="Email" placeholder="info@business.com" error={businessForm.formState.errors.email?.message} {...businessForm.register('email')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Currency Symbol" {...businessForm.register('currency_symbol')} />
                  <Input label="Currency Code" {...businessForm.register('currency_code')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Owner Account */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-heading font-bold text-txt-primary mb-2">Create Owner Account</h2>
              <p className="text-sm text-txt-secondary mb-6">This will be the admin account with full access.</p>
              <div className="space-y-4">
                <Input label="Full Name" placeholder="Your name" error={ownerForm.formState.errors.name?.message} {...ownerForm.register('name')} />
                <Input label="Username" placeholder="Choose a username" error={ownerForm.formState.errors.username?.message} {...ownerForm.register('username')} />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a password"
                  error={ownerForm.formState.errors.password?.message}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-txt-primary">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...ownerForm.register('password')}
                />
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  error={ownerForm.formState.errors.confirmPassword?.message}
                  {...ownerForm.register('confirmPassword')}
                />
              </div>
            </div>
          )}

          {/* Step 4: Module Selection */}
          {step === 4 && (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-heading font-bold text-txt-primary mb-2">Choose Your Modules</h2>
              <p className="text-sm text-txt-secondary mb-6">
                Pre-selected based on {selectedType?.label}. Toggle as needed.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MODULE_LABELS).map(([key, label]) => {
                  const isAlwaysOn = ['dashboard', 'settings', 'backup'].includes(key)
                  const isActive = activeModules.includes(key)
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        isActive ? 'border-primary bg-primary-light' : 'border-surface-border hover:bg-gray-50',
                        isAlwaysOn && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleModule(key)}
                        disabled={isAlwaysOn}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-txt-primary">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-success mx-auto flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-white mb-3">You&apos;re All Set!</h1>
              <p className="text-slate-400 mb-8">
                Your business has been configured. Let&apos;s get to work.
              </p>
              <Button size="lg" onClick={() => navigate('/dashboard', { replace: true })}>
                Enter Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {step > 0 && step < 5 && (
        <div className="flex items-center justify-between px-8 pb-6">
          <Button variant="ghost" className="text-slate-400" onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canGoNext()} loading={saving} icon={step === 4 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}>
            {step === 4 ? 'Finish Setup' : 'Continue'}
          </Button>
        </div>
      )}
    </div>
  )
}
