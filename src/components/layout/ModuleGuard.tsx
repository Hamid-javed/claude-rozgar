import { Navigate } from 'react-router-dom'
import { useModules } from '@/hooks/useModules'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShieldOff } from 'lucide-react'

interface ModuleGuardProps {
  moduleKey: string
  children: React.ReactNode
}

export function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { isModuleActive } = useModules()

  if (!isModuleActive(moduleKey)) {
    return (
      <EmptyState
        icon={<ShieldOff className="w-8 h-8" />}
        title="Module Not Active"
        description="This module is not enabled for your business type. You can enable it in Settings."
      />
    )
  }

  return <>{children}</>
}
