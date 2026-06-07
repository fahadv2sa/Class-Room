'use client'

import { useEffect, useState } from 'react'
import { Brain, FileText, Lightbulb, RefreshCw, Route, ShieldCheck } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useLanguage } from '@/components/language-provider'
import { useLevel } from '@/components/level-provider'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { withLevel } from '@/lib/i18n/ui'

type AIRecommendationRecord = {
  id: string
  recommendationType: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'ACTIVE' | 'DISMISSED' | 'RESOLVED'
  title: string
  recommendation: string
  explanation: string
  dataSources: string[]
  generatedAt: string
}

type AISummaryRecord = {
  id: string
  summaryType: string
  period: string | null
  title: string
  summary: string
  explanation: string
  dataSources: string[]
  generatedAt: string
}

type AutomationDefinitionRecord = {
  id: string
  name: string
  triggerType: string
  actionType: string
  isActive: boolean
}

function priorityVariant(priority: AIRecommendationRecord['priority']) {
  if (priority === 'CRITICAL') return 'danger'
  if (priority === 'HIGH') return 'warning'
  if (priority === 'MEDIUM') return 'accent'
  return 'default'
}

export default function AIFoundationPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [recommendations, setRecommendations] = useState<AIRecommendationRecord[]>([])
  const [summaries, setSummaries] = useState<AISummaryRecord[]>([])
  const [automationDefinitions, setAutomationDefinitions] = useState<AutomationDefinitionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadStoredFoundation() {
    const [recommendationsResponse, summariesResponse, automationResponse] = await Promise.all([
      fetch('/api/ai/recommendations?pageSize=50', { cache: 'no-store' }),
      fetch('/api/ai/summaries?pageSize=20', { cache: 'no-store' }),
      fetch('/api/automation-definitions?pageSize=20', { cache: 'no-store' }),
    ])
    const [recommendationsData, summariesData, automationData] = await Promise.all([
      recommendationsResponse.ok ? recommendationsResponse.json() : Promise.resolve({ recommendations: [] }),
      summariesResponse.ok ? summariesResponse.json() : Promise.resolve({ summaries: [] }),
      automationResponse.ok ? automationResponse.json() : Promise.resolve({ automationDefinitions: [] }),
    ])
    setRecommendations(recommendationsData.recommendations ?? [])
    setSummaries(summariesData.summaries ?? [])
    setAutomationDefinitions(automationData.automationDefinitions ?? [])
  }

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      await loadStoredFoundation()
      if (active) setLoading(false)
    }

    load().catch(() => {
      if (!active) return
      setRecommendations([])
      setSummaries([])
      setAutomationDefinitions([])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  async function refreshFoundation() {
    setRefreshing(true)
    try {
      await Promise.all([
        fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: 'DAILY' }),
        }),
        fetch('/api/ai/summaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: 'DAILY' }),
        }),
        fetch('/api/automation-definitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
      ])
      await loadStoredFoundation()
    } finally {
      setRefreshing(false)
    }
  }

  if (!level) return null

  const activeRecommendations = recommendations.filter((item) => item.status === 'ACTIVE')
  const criticalRecommendations = activeRecommendations.filter((item) => item.priority === 'CRITICAL' || item.priority === 'HIGH')
  const activeAutomation = automationDefinitions.filter((item) => item.isActive)

  return (
    <DashboardShell title={t('aiFoundation.title')} subtitle={withLevel('aiFoundation.subtitle', level, t)}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={refreshFoundation} disabled={loading || refreshing}>
            <RefreshCw className="size-4" />
            {refreshing ? t('aiFoundation.refreshing') : t('aiFoundation.refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label={t('aiFoundation.activeRecommendations')} value={activeRecommendations.length} icon={Lightbulb} tone="accent" />
          <StatCard label={t('aiFoundation.highPriority')} value={criticalRecommendations.length} icon={ShieldCheck} tone="warning" />
          <StatCard label={t('aiFoundation.summaries')} value={summaries.length} icon={FileText} tone="success" />
          <StatCard label={t('aiFoundation.automationDefinitions')} value={activeAutomation.length} icon={Route} tone="accent" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="p-0">
              <div className="border-b border-border/60 p-5">
                <h3 className="text-base font-extrabold tracking-tight">{t('aiFoundation.recommendations')}</h3>
                <p className="text-xs text-muted-foreground">{t('aiFoundation.recommendationsDesc')}</p>
              </div>
              <div className="divide-y divide-border/60">
                {loading && <p className="py-14 text-center text-sm text-muted-foreground">{t('common.loading')}</p>}
                {!loading && recommendations.length === 0 && (
                  <p className="py-14 text-center text-sm text-muted-foreground">{t('aiFoundation.emptyRecommendations')}</p>
                )}
                {recommendations.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">{item.title}</p>
                          <Badge variant={priorityVariant(item.priority)}>{t(`aiFoundation.priority.${item.priority}`)}</Badge>
                          <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>{t(`aiFoundation.status.${item.status}`)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{item.recommendation}</p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">{new Date(item.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-bold uppercase text-muted-foreground">{t('aiFoundation.why')}</p>
                      <p className="mt-1 text-sm">{item.explanation}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.dataSources.map((source) => (
                          <Badge key={source} variant="outline">{source}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-0">
              <div className="border-b border-border/60 p-5">
                <h3 className="text-base font-extrabold tracking-tight">{t('aiFoundation.summariesTitle')}</h3>
                <p className="text-xs text-muted-foreground">{t('aiFoundation.summariesDesc')}</p>
              </div>
              <div className="divide-y divide-border/60">
                {summaries.length === 0 && (
                  <p className="py-14 text-center text-sm text-muted-foreground">{loading ? t('common.loading') : t('aiFoundation.emptySummaries')}</p>
                )}
                {summaries.map((summary) => (
                  <div key={summary.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{summary.title}</p>
                      <Badge variant="accent">{summary.period ?? summary.summaryType}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{summary.summary}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{summary.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-extrabold tracking-tight">{t('aiFoundation.explainability')}</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{t('aiFoundation.explainabilityCopy')}</p>
                <p>{t('aiFoundation.noChatbot')}</p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Route className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-extrabold tracking-tight">{t('aiFoundation.automationTitle')}</h3>
              </div>
              <div className="space-y-3">
                {automationDefinitions.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? t('common.loading') : t('aiFoundation.emptyAutomation')}
                  </p>
                )}
                {automationDefinitions.map((definition) => (
                  <div key={definition.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold">{definition.name}</p>
                      <Badge variant={definition.isActive ? 'success' : 'default'}>
                        {definition.isActive ? t('aiFoundation.active') : t('aiFoundation.inactive')}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {definition.triggerType} / {definition.actionType}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">{t('aiFoundation.definitionOnly')}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
