type State = "hover" | "focus" | "active" | "disabled";
export interface ButtonProps { variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"; size?: "sm" | "md" | "lg" | "icon" | "icon-sm" | "fab"; icon?: string; loading?: boolean; disabled?: boolean; full?: boolean; href?: string; state?: State; type?: "button" | "submit"; onClick?: () => void; children?: any }
export interface FieldProps { label?: string; optional?: boolean; hint?: string; error?: string; required?: boolean; id?: string; children: any }
export interface InputProps { type?: string; icon?: string; state?: State; placeholder?: string; value?: string; defaultValue?: string; onChange?: (e: any) => void }
export interface TextareaProps { rows?: number; state?: State; placeholder?: string; value?: string; defaultValue?: string; onChange?: (e: any) => void }
export interface SelectProps { options: { value: string; label: string }[]; state?: State; value?: string; defaultValue?: string; onChange?: (e: any) => void }
export interface CheckboxProps { checked?: boolean; defaultChecked?: boolean; disabled?: boolean; state?: State; onChange?: (e: any) => void; children?: any }
export interface SwitchProps extends CheckboxProps {}
export interface ChipProps { selected?: boolean; icon?: string; disabled?: boolean; state?: State; onClick?: () => void; children?: any }
export interface BadgeProps { variant?: "neutral" | "primary" | "outline" | "success" | "warning" | "info" | "destructive"; icon?: string; children?: any }
export interface CardProps { variant?: "flat" | "dashed"; interactive?: boolean; as?: string; href?: string; state?: "hover"; className?: string; children?: any }
export interface AlertProps { variant?: "info" | "success" | "warning" | "destructive"; title?: string; action?: any; children?: any }
export interface TabsProps { items: { value: string; label: string; icon?: string; count?: number }[]; value: string; onChange?: (v: string) => void; variant?: "pills" | "underline" }
export interface DialogProps { title: string; description?: string; footer?: any; onClose?: () => void; children?: any }
export interface SheetProps extends DialogProps {}
export interface SkeletonProps { width?: number | string; height?: number | string; circle?: boolean }
export interface EmptyStateProps { icon?: string; title: string; description?: string; actions?: any; children?: any }
export interface ErrorStateProps { title?: string; description?: string; icon?: string; onRetry?: () => void; retryLabel?: string }
export interface SidebarProps { items: { href: string; label: string; icon: string; admin?: boolean }[]; active?: string; writeLabel?: string; writeHref?: string; dark?: boolean; onToggleTheme?: () => void; onSignOut?: () => void }
export interface BottomNavProps { items: { href: string; label: string; icon: string }[]; active?: string }
export interface DataListProps { columns: { key: string; label: string; align?: "left" | "right"; action?: boolean }[]; rows: Record<string, any>[] }
export interface ReflectionCardProps { date: string; favorite?: boolean; onToggleFavorite?: () => void; photo?: string; photoAlt?: string; tags?: string[]; children?: any }
export interface CuadernoCardProps { count: number; title: string; date: string; writeHref?: string; openHref?: string; confirmingDelete?: boolean; onDelete?: () => void; onConfirmDelete?: () => void; onCancelDelete?: () => void }
export interface JourneyCardProps { image?: string; category: string; title: string; tagline?: string; days: number; time?: string; featured?: boolean; premium?: boolean; status?: { variant: string; icon: string; label: string }; cta?: string }
export interface StatProps { value: string | number; label: string; accent?: boolean; href?: string }
export interface AvatarProps { name?: string; size?: "sm" }
export interface PageHeaderProps { eyebrow?: string; title: string; subtitle?: string; actions?: any }
export interface LogoProps { size?: number }
export interface IconProps { name: string; size?: number; label?: string }
