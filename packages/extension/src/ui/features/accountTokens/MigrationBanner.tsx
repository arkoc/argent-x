// FIXME: delete this file when Cairo 9 is on mainnet
import { FC } from "react"
import { Link } from "react-router-dom"

import { Banner } from "../../components/Banner"
import { WarningIcon } from "../../components/Icons/WarningIcon"
import { routes } from "../../routes"
import { useAccounts } from "../accounts/accounts.state"

export const MigrationBanner: FC = () => (
  <Link
    to={routes.accountTokens()}
    onClick={() => useAccounts.setState({ showMigrationScreen: true })}
  >
    <Banner
      title="Please migrate your funds"
      description="This account will be deprecated soon"
      theme="danger"
      icon={<WarningIcon style={{ transform: "scale(1.5)" }} />}
    />
  </Link>
)
